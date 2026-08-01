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
        // El endpoint es público (el catálogo lo consume sin sesión), pero incluirInactivos=true
        // expone inventario que el resto del controlador sí protege (código, stock, activo/inactivo).
        // Sin este chequeo, cualquier anónimo podía leer el inventario completo con solo agregar
        // el query param, sin necesitar el token de Admin que Crear/Actualizar/Eliminar sí exigen.
        if (incluirInactivos && !User.IsInRole("Admin"))
        {
            return Forbid();
        }

        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _context.Productos
            .Include(p => p.Materiales)
            .Include(p => p.Temporadas)
            .Include(p => p.Stock)
            .Include(p => p.ImagenesPorColor)
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
            .Include(p => p.ImagenesPorColor)
            .AsSplitQuery()
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == id);

        if (producto is null) return NotFound();
        return Ok(ToDto(producto));
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<ActionResult<ProductoDto>> Crear([FromForm] ProductoFormRequest request)
    {
        if (await _context.Productos.AnyAsync(p => p.Codigo == request.Codigo))
        {
            return Conflict($"Ya existe un producto con el código '{request.Codigo}'.");
        }

        List<ProductoStock> stock;
        List<ProductoMaterial> materiales;
        List<ProductoTemporada> temporadas;
        var imagenesPorColor = new List<ProductoImagenColor>();
        try
        {
            // Primero el parseo en memoria (barato) y solo si es válido escribimos a
            // disco: así un stockJson malformado no deja una imagen huérfana sin
            // producto asociado. Por eso Materiales/Temporadas también se parsean (y
            // validan su longitud) aquí dentro, antes de guardar cualquier archivo.
            stock = ParsearStock(request.StockJson, Guid.Empty);
            materiales = ParsearCsv(request.Materiales, 50, "Materiales", valor => new ProductoMaterial { Id = Guid.NewGuid(), Valor = valor });
            temporadas = ParsearCsv(request.Temporadas, 20, "Temporadas", valor => new ProductoTemporada { Id = Guid.NewGuid(), Valor = valor });

            // No hay foto "principal" independiente: se necesita al menos una foto de
            // color para tener algo que mostrar como portada del producto.
            var fotosPorColor = ExtraerFotosPorColor(Request.Form.Files);
            if (fotosPorColor.Count == 0)
            {
                throw new InvalidOperationException("Sube al menos una foto de color antes de guardar.");
            }

            foreach (var (color, archivo) in fotosPorColor)
            {
                var urlColor = await _imageStorage.GuardarAsync(archivo, Request);
                imagenesPorColor.Add(new ProductoImagenColor { Id = Guid.NewGuid(), Color = color, ImagenUrl = urlColor });
            }
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
            // La primera foto de color subida se usa como portada del producto (catálogo,
            // miniatura del inventario, etc.) — no hay un upload de "foto principal" separado.
            ImagenUrl = imagenesPorColor[0].ImagenUrl
        };

        foreach (var item in materiales) { item.ProductoId = producto.Id; }
        producto.Materiales = materiales;
        foreach (var item in temporadas) { item.ProductoId = producto.Id; }
        producto.Temporadas = temporadas;
        foreach (var item in stock) { item.ProductoId = producto.Id; }
        producto.Stock = stock;
        foreach (var item in imagenesPorColor) { item.ProductoId = producto.Id; }
        producto.ImagenesPorColor = imagenesPorColor;

        _context.Productos.Add(producto);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(ObtenerPorId), new { id = producto.Id }, ToDto(producto));
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ProductoDto>> Actualizar(Guid id, [FromForm] ProductoFormRequest request)
    {
        var producto = await _context.Productos
            .Include(p => p.Materiales)
            .Include(p => p.Temporadas)
            .Include(p => p.Stock)
            .Include(p => p.ImagenesPorColor)
            .AsSplitQuery()
            .FirstOrDefaultAsync(p => p.Id == id);

        if (producto is null) return NotFound();

        // Solo valida unicidad si el código realmente está cambiando: ya existen productos
        // reales con códigos duplicados de antes de este chequeo (nunca hubo unicidad), y
        // exigirla también al reenviar el mismo código sin tocarlo dejaría esos productos
        // imposibles de editar (cualquier guardado los "chocaría" contra sus propios duplicados).
        if (request.Codigo != producto.Codigo &&
            await _context.Productos.AnyAsync(p => p.Codigo == request.Codigo && p.Id != id))
        {
            return Conflict($"Ya existe otro producto con el código '{request.Codigo}'.");
        }

        List<ProductoStock> nuevoStock;
        List<ProductoMaterial> nuevosMateriales;
        List<ProductoTemporada> nuevasTemporadas;
        var imagenesPorColor = new List<ProductoImagenColor>();
        Dictionary<string, IFormFile> fotosPorColor;
        try
        {
            nuevoStock = ParsearStock(request.StockJson, id);
            nuevosMateriales = ParsearCsv(request.Materiales, 50, "Materiales", valor => new ProductoMaterial { Id = Guid.NewGuid(), ProductoId = id, Valor = valor });
            nuevasTemporadas = ParsearCsv(request.Temporadas, 20, "Temporadas", valor => new ProductoTemporada { Id = Guid.NewGuid(), ProductoId = id, Valor = valor });

            // Si un color no trae una foto nueva en este guardado, se conserva la que ya
            // tenía (si tenía alguna) — no hay foto "principal" que suba aparte.
            fotosPorColor = ExtraerFotosPorColor(Request.Form.Files);
            foreach (var color in nuevoStock.Select(s => s.Color).Distinct())
            {
                if (fotosPorColor.TryGetValue(color, out var archivo))
                {
                    var urlColor = await _imageStorage.GuardarAsync(archivo, Request);
                    imagenesPorColor.Add(new ProductoImagenColor { Id = Guid.NewGuid(), ProductoId = id, Color = color, ImagenUrl = urlColor });
                }
                else
                {
                    var existente = producto.ImagenesPorColor.FirstOrDefault(i => i.Color == color);
                    if (existente is not null)
                    {
                        imagenesPorColor.Add(new ProductoImagenColor { Id = Guid.NewGuid(), ProductoId = id, Color = color, ImagenUrl = existente.ImagenUrl });
                    }
                }
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
        // Solo se recalcula la portada si esta edición subió alguna foto de color nueva;
        // si el guardado no tocó ninguna foto (solo precio/stock/etc.), se conserva la
        // portada actual tal cual, incluso para prendas viejas que aún no tienen fotos
        // por color y solo dependen de esta URL.
        if (fotosPorColor.Count > 0)
        {
            var primeraFotoNueva = imagenesPorColor.FirstOrDefault(i => fotosPorColor.ContainsKey(i.Color));
            if (primeraFotoNueva is not null)
            {
                producto.ImagenUrl = primeraFotoNueva.ImagenUrl;
            }
        }

        // "producto" ya está rastreado (se cargó con una consulta, no con Add()), así que
        // EF Core no marca automáticamente las entidades hijas nuevas como "Added" solo por
        // colgarlas de la colección de navegación; hay que agregarlas explícitamente al
        // DbSet o terminan generando UPDATE contra filas que no existen.
        _context.ProductoMateriales.RemoveRange(producto.Materiales);
        _context.ProductoTemporadas.RemoveRange(producto.Temporadas);
        _context.ProductoStock.RemoveRange(producto.Stock);
        _context.ProductoImagenesColor.RemoveRange(producto.ImagenesPorColor);

        _context.ProductoMateriales.AddRange(nuevosMateriales);
        _context.ProductoTemporadas.AddRange(nuevasTemporadas);
        _context.ProductoStock.AddRange(nuevoStock);
        _context.ProductoImagenesColor.AddRange(imagenesPorColor);

        producto.Materiales = nuevosMateriales;
        producto.Temporadas = nuevasTemporadas;
        producto.Stock = nuevoStock;
        producto.ImagenesPorColor = imagenesPorColor;

        await _context.SaveChangesAsync();
        return Ok(ToDto(producto));
    }

    // Activa o desactiva un producto sin tocar el resto de sus datos
    [Authorize(Roles = "Admin")]
    [HttpPatch("{id:guid}/estado")]
    public async Task<ActionResult<ProductoDto>> CambiarEstado(Guid id, [FromBody] CambiarEstadoRequest request)
    {
        var producto = await _context.Productos
            .Include(p => p.Materiales)
            .Include(p => p.Temporadas)
            .Include(p => p.Stock)
            .Include(p => p.ImagenesPorColor)
            .AsSplitQuery()
            .FirstOrDefaultAsync(p => p.Id == id);

        if (producto is null) return NotFound();

        producto.Activo = request.Activo;
        await _context.SaveChangesAsync();

        return Ok(ToDto(producto));
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Eliminar(Guid id)
    {
        var producto = await _context.Productos
            .Include(p => p.ImagenesPorColor)
            .FirstOrDefaultAsync(p => p.Id == id);
        if (producto is null) return NotFound();

        _context.Productos.Remove(producto); // Materiales, Stock e ImagenesPorColor se eliminan en cascada
        await _context.SaveChangesAsync();

        _imageStorage.BorrarSiEsLocal(producto.ImagenUrl);
        foreach (var imagenColor in producto.ImagenesPorColor)
        {
            _imageStorage.BorrarSiEsLocal(imagenColor.ImagenUrl);
        }

        return NoContent();
    }

    // Sin este chequeo, un valor más largo que la columna (ver los HasMaxLength en
    // AppDbContext) pasaba el binding/deserialización sin problema y solo fallaba en
    // SaveChangesAsync con un SqlException de truncamiento, que el pipeline convierte
    // en un 500 genérico en vez de decirle al usuario qué campo hay que acortar.
    private static void ValidarLongitud(string valor, int maxLength, string campo)
    {
        if (valor.Length > maxLength)
        {
            throw new InvalidOperationException($"El campo '{campo}' no puede superar los {maxLength} caracteres: \"{valor}\".");
        }
    }

    private static List<T> ParsearCsv<T>(string csv, int maxLength, string campo, Func<string, T> crear)
    {
        if (string.IsNullOrWhiteSpace(csv)) return new List<T>();

        return csv
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(valor =>
            {
                ValidarLongitud(valor, maxLength, campo);
                return crear(valor);
            })
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
            .Select(i =>
            {
                ValidarLongitud(i.Talla, 20, "Talla");
                ValidarLongitud(i.Color, 50, "Color");
                return new ProductoStock
                {
                    Id = Guid.NewGuid(),
                    ProductoId = productoId,
                    Talla = i.Talla,
                    Color = i.Color,
                    Cantidad = Math.Max(0, i.Cantidad)
                };
            })
            .ToList();
    }

    // Los campos de archivo por color llegan en el multipart con el nombre
    // "fotoColor:{color}" (ej. "fotoColor:Azul Claro"): no hay forma de bindear un
    // diccionario dinámico así con [FromForm], así que se leen directo de Request.Form.Files.
    private static Dictionary<string, IFormFile> ExtraerFotosPorColor(IFormFileCollection archivos)
    {
        const string prefijo = "fotoColor:";
        var porColor = archivos
            .Where(f => f.Name.StartsWith(prefijo, StringComparison.Ordinal) && f.Length > 0)
            .ToDictionary(f => f.Name[prefijo.Length..], f => f, StringComparer.OrdinalIgnoreCase);

        foreach (var color in porColor.Keys)
        {
            ValidarLongitud(color, 50, "Color");
        }

        return porColor;
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
        Descripcion = p.Descripcion,
        ImagenesPorColor = p.ImagenesPorColor.Select(i => new ImagenColorDto { Color = i.Color, ImagenUrl = i.ImagenUrl }).ToList()
    };
}
