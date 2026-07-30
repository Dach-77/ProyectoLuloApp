using System.Text.Json;
using LuloApp.Api.Data;
using LuloApp.Api.Dtos;
using LuloApp.Api.Models;
using LuloApp.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LuloApp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductosController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ImageStorageService _imageStorage;

    public ProductosController(AppDbContext context, ImageStorageService imageStorage)
    {
        _context = context;
        _imageStorage = imageStorage;
    }

    // El catálogo público solo pide activos; el panel de admin pasa incluirInactivos=true
    [HttpGet]
    public async Task<ActionResult<PagedResultDto<ProductoDto>>> ObtenerTodos(
        [FromQuery] bool incluirInactivos = false,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _context.Productos
            .Include(p => p.Materiales)
            .Include(p => p.Temporadas)
            .Include(p => p.Stock)
            .AsSplitQuery()
            .AsNoTracking()
            .AsQueryable();

        if (!incluirInactivos)
        {
            query = query.Where(p => p.Activo);
        }

        query = query.OrderByDescending(p => p.FechaCreacion).ThenBy(p => p.Id);

        var totalCount = await query.CountAsync();
        var productos = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

        return Ok(new PagedResultDto<ProductoDto>
        {
            Items = productos.Select(ToDto).ToList(),
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        });
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ProductoDto>> ObtenerPorId(Guid id)
    {
        var producto = await _context.Productos
            .Include(p => p.Materiales)
            .Include(p => p.Temporadas)
            .Include(p => p.Stock)
            .AsSplitQuery()
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == id);

        if (producto is null) return NotFound();
        return Ok(ToDto(producto));
    }

    [Authorize]
    [HttpPost]
    public async Task<ActionResult<ProductoDto>> Crear([FromForm] ProductoFormRequest request)
    {
        if (request.Foto is null)
        {
            return BadRequest("La foto de la prenda es obligatoria.");
        }

        string imagenUrl;
        List<ProductoStock> stock;
        try
        {
            // Primero el parseo en memoria (barato) y solo si es válido escribimos a
            // disco: así un stockJson malformado no deja una imagen huérfana sin
            // producto asociado.
            stock = ParsearStock(request.StockJson, Guid.Empty);
            imagenUrl = await _imageStorage.GuardarAsync(request.Foto, Request);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }

        var producto = new Producto
        {
            Id = Guid.NewGuid(),
            Nombre = request.Nombre,
            Codigo = request.Codigo,
            Genero = request.Genero,
            Precio = request.Precio,
            Descripcion = request.Descripcion ?? string.Empty,
            Activo = true,
            FechaCreacion = DateTime.UtcNow,
            ImagenUrl = imagenUrl
        };

        producto.Materiales = ParsearCsv(request.Materiales, valor => new ProductoMaterial { Id = Guid.NewGuid(), ProductoId = producto.Id, Valor = valor });
        producto.Temporadas = ParsearCsv(request.Temporadas, valor => new ProductoTemporada { Id = Guid.NewGuid(), ProductoId = producto.Id, Valor = valor });
        foreach (var item in stock) { item.ProductoId = producto.Id; }
        producto.Stock = stock;

        _context.Productos.Add(producto);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(ObtenerPorId), new { id = producto.Id }, ToDto(producto));
    }

    [Authorize]
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ProductoDto>> Actualizar(Guid id, [FromForm] ProductoFormRequest request)
    {
        var producto = await _context.Productos
            .Include(p => p.Materiales)
            .Include(p => p.Temporadas)
            .Include(p => p.Stock)
            .AsSplitQuery()
            .FirstOrDefaultAsync(p => p.Id == id);

        if (producto is null) return NotFound();

        List<ProductoStock> nuevoStock;
        string? nuevaImagenUrl = null;
        try
        {
            nuevoStock = ParsearStock(request.StockJson, id);
            // La foto es opcional al editar: si no llega una nueva, se conserva la actual
            if (request.Foto is not null && request.Foto.Length > 0)
            {
                nuevaImagenUrl = await _imageStorage.GuardarAsync(request.Foto, Request);
            }
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }

        producto.Nombre = request.Nombre;
        producto.Codigo = request.Codigo;
        producto.Genero = request.Genero;
        producto.Precio = request.Precio;
        producto.Descripcion = request.Descripcion ?? string.Empty;
        if (nuevaImagenUrl is not null)
        {
            producto.ImagenUrl = nuevaImagenUrl;
        }

        // "producto" ya está rastreado (se cargó con una consulta, no con Add()), así que
        // EF Core no marca automáticamente las entidades hijas nuevas como "Added" solo por
        // colgarlas de la colección de navegación; hay que agregarlas explícitamente al
        // DbSet o terminan generando UPDATE contra filas que no existen.
        _context.ProductoMateriales.RemoveRange(producto.Materiales);
        _context.ProductoTemporadas.RemoveRange(producto.Temporadas);
        _context.ProductoStock.RemoveRange(producto.Stock);

        var nuevosMateriales = ParsearCsv(request.Materiales, valor => new ProductoMaterial { Id = Guid.NewGuid(), ProductoId = id, Valor = valor });
        var nuevasTemporadas = ParsearCsv(request.Temporadas, valor => new ProductoTemporada { Id = Guid.NewGuid(), ProductoId = id, Valor = valor });

        _context.ProductoMateriales.AddRange(nuevosMateriales);
        _context.ProductoTemporadas.AddRange(nuevasTemporadas);
        _context.ProductoStock.AddRange(nuevoStock);

        producto.Materiales = nuevosMateriales;
        producto.Temporadas = nuevasTemporadas;
        producto.Stock = nuevoStock;

        await _context.SaveChangesAsync();
        return Ok(ToDto(producto));
    }

    // Activa o desactiva un producto sin tocar el resto de sus datos
    [Authorize]
    [HttpPatch("{id:guid}/estado")]
    public async Task<ActionResult<ProductoDto>> CambiarEstado(Guid id, [FromBody] CambiarEstadoRequest request)
    {
        var producto = await _context.Productos
            .Include(p => p.Materiales)
            .Include(p => p.Temporadas)
            .Include(p => p.Stock)
            .AsSplitQuery()
            .FirstOrDefaultAsync(p => p.Id == id);

        if (producto is null) return NotFound();

        producto.Activo = request.Activo;
        await _context.SaveChangesAsync();

        return Ok(ToDto(producto));
    }

    [Authorize]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Eliminar(Guid id)
    {
        var producto = await _context.Productos.FirstOrDefaultAsync(p => p.Id == id);
        if (producto is null) return NotFound();

        _context.Productos.Remove(producto); // Materiales y Stock se eliminan en cascada
        await _context.SaveChangesAsync();

        _imageStorage.BorrarSiEsLocal(producto.ImagenUrl);

        return NoContent();
    }

    private static List<T> ParsearCsv<T>(string csv, Func<string, T> crear)
    {
        if (string.IsNullOrWhiteSpace(csv)) return new List<T>();

        return csv
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(crear)
            .ToList();
    }

    private static List<ProductoStock> ParsearStock(string stockJson, Guid productoId)
    {
        if (string.IsNullOrWhiteSpace(stockJson)) return new List<ProductoStock>();

        List<StockItemRequest> items;
        try
        {
            items = JsonSerializer.Deserialize<List<StockItemRequest>>(stockJson, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            }) ?? new List<StockItemRequest>();
        }
        catch (JsonException)
        {
            throw new InvalidOperationException("El stock enviado tiene un formato inválido.");
        }

        return items
            .Where(i => !string.IsNullOrWhiteSpace(i.Talla) && !string.IsNullOrWhiteSpace(i.Color))
            .Select(i => new ProductoStock
            {
                Id = Guid.NewGuid(),
                ProductoId = productoId,
                Talla = i.Talla,
                Color = i.Color,
                Cantidad = Math.Max(0, i.Cantidad)
            })
            .ToList();
    }

    private static ProductoDto ToDto(Producto p) => new()
    {
        Id = p.Id,
        Nombre = p.Nombre,
        Codigo = p.Codigo,
        Activo = p.Activo,
        Genero = p.Genero,
        FechaCreacion = p.FechaCreacion,
        Materiales = p.Materiales.Select(m => m.Valor).ToList(),
        Temporadas = p.Temporadas.Select(t => t.Valor).ToList(),
        Tallas = p.Stock.Select(s => s.Talla).Distinct().ToList(),
        Colores = p.Stock.Select(s => s.Color).Distinct().ToList(),
        Stock = p.Stock.Select(s => new StockDto { Talla = s.Talla, Color = s.Color, Cantidad = s.Cantidad }).ToList(),
        Precio = p.Precio,
        ImagenUrl = p.ImagenUrl,
        Descripcion = p.Descripcion
    };
}
