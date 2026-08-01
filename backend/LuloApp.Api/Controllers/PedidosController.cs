using System.Security.Claims;
using LuloApp.Api.Data;
using LuloApp.Api.Dtos;
using LuloApp.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LuloApp.Api.Controllers;

[ApiController]
[Route("api/pedidos")]
public class PedidosController : ControllerBase
{
    private readonly AppDbContext _context;

    public PedidosController(AppDbContext context)
    {
        _context = context;
    }

    [Authorize(Roles = "Cliente")]
    [HttpPost]
    public async Task<ActionResult<PedidoDto>> Crear(CrearPedidoRequest request)
    {
        var clienteId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        // Lectura barata primero: qué productos existen/están activos, y su nombre/precio
        // vigente para snapshotear en el pedido. Todo esto ANTES de tocar stock o abrir
        // transacción, siguiendo el mismo estilo que ProductosController.
        var productoIds = request.Items.Select(i => i.ProductoId).Distinct().ToList();
        var productos = await _context.Productos
            .AsNoTracking()
            .Where(p => productoIds.Contains(p.Id))
            .ToDictionaryAsync(p => p.Id);

        var conflictos = new List<StockConflictoItemDto>();
        foreach (var item in request.Items)
        {
            if (!productos.TryGetValue(item.ProductoId, out var producto))
            {
                conflictos.Add(NuevoConflicto(item, 0, "ProductoInexistente"));
            }
            else if (!producto.Activo)
            {
                conflictos.Add(NuevoConflicto(item, 0, "ProductoInactivo"));
            }
        }

        if (conflictos.Count > 0)
        {
            return Conflict(new StockConflictoDto { Items = conflictos });
        }

        using var transaction = await _context.Database.BeginTransactionAsync();

        // Descuento atómico por línea: un solo UPDATE que chequea y descuenta en la misma
        // sentencia (no "leer cantidad y luego guardar": eso no evita que dos checkouts
        // simultáneos sobrevendan la última unidad). RowsAffected == 0 significa que no
        // había stock suficiente (o la combinación no existe).
        foreach (var item in request.Items)
        {
            var filasAfectadas = await _context.ProductoStock
                .Where(s => s.ProductoId == item.ProductoId && s.Talla == item.Talla
                         && s.Color == item.Color && s.Cantidad >= item.Cantidad)
                .ExecuteUpdateAsync(s => s.SetProperty(x => x.Cantidad, x => x.Cantidad - item.Cantidad));

            if (filasAfectadas == 0)
            {
                var cantidadDisponible = await _context.ProductoStock
                    .Where(s => s.ProductoId == item.ProductoId && s.Talla == item.Talla && s.Color == item.Color)
                    .Select(s => s.Cantidad)
                    .FirstOrDefaultAsync();

                conflictos.Add(NuevoConflicto(item, cantidadDisponible, "SinStock"));
            }
        }

        if (conflictos.Count > 0)
        {
            // Sin CommitAsync: al salir del using sin comitear se revierte toda la
            // transacción, incluyendo los ExecuteUpdateAsync que sí llegaron a aplicarse.
            return Conflict(new StockConflictoDto { Items = conflictos });
        }

        var pedido = new Pedido
        {
            Id = Guid.NewGuid(),
            ClienteId = clienteId,
            FechaCreacion = DateTime.UtcNow
        };

        pedido.Items = request.Items.Select(item =>
        {
            var producto = productos[item.ProductoId];
            return new PedidoItem
            {
                Id = Guid.NewGuid(),
                PedidoId = pedido.Id,
                ProductoId = producto.Id,
                NombreProducto = producto.Nombre,
                Talla = item.Talla,
                Color = item.Color,
                Cantidad = item.Cantidad,
                PrecioUnitario = producto.Precio
            };
        }).ToList();

        pedido.Total = pedido.Items.Sum(i => i.PrecioUnitario * i.Cantidad);

        _context.Pedidos.Add(pedido);
        await _context.SaveChangesAsync();
        await transaction.CommitAsync();

        return StatusCode(StatusCodes.Status201Created, ToDto(pedido));
    }

    [Authorize(Roles = "Cliente")]
    [HttpGet("mios")]
    public async Task<ActionResult<PagedResultDto<PedidoDto>>> ObtenerMios([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var clienteId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        return await ObtenerPaginado(_context.Pedidos.Where(p => p.ClienteId == clienteId), page, pageSize, incluirCliente: false);
    }

    [Authorize(Roles = "Admin")]
    [HttpGet]
    public async Task<ActionResult<PagedResultDto<PedidoDto>>> ObtenerTodos([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        return await ObtenerPaginado(_context.Pedidos, page, pageSize, incluirCliente: true);
    }

    private async Task<ActionResult<PagedResultDto<PedidoDto>>> ObtenerPaginado(IQueryable<Pedido> query, int page, int pageSize, bool incluirCliente)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        query = query.Include(p => p.Items).AsSplitQuery().AsNoTracking().OrderByDescending(p => p.FechaCreacion);

        var totalCount = await query.CountAsync();
        var pedidos = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

        var clientesPorId = new Dictionary<Guid, Cliente>();
        if (incluirCliente && pedidos.Count > 0)
        {
            var clienteIds = pedidos.Select(p => p.ClienteId).Distinct().ToList();
            clientesPorId = await _context.Clientes.AsNoTracking()
                .Where(c => clienteIds.Contains(c.Id))
                .ToDictionaryAsync(c => c.Id);
        }

        return new PagedResultDto<PedidoDto>
        {
            Items = pedidos.Select(p => ToDto(p, clientesPorId.GetValueOrDefault(p.ClienteId))).ToList(),
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        };
    }

    private static StockConflictoItemDto NuevoConflicto(PedidoItemRequest item, int cantidadDisponible, string motivo) => new()
    {
        ProductoId = item.ProductoId,
        Talla = item.Talla,
        Color = item.Color,
        CantidadSolicitada = item.Cantidad,
        CantidadDisponible = cantidadDisponible,
        Motivo = motivo
    };

    private static PedidoDto ToDto(Pedido p, Cliente? cliente = null) => new()
    {
        Id = p.Id,
        FechaCreacion = p.FechaCreacion,
        Total = p.Total,
        Estado = p.Estado,
        Items = p.Items.Select(i => new PedidoItemDto
        {
            NombreProducto = i.NombreProducto,
            Talla = i.Talla,
            Color = i.Color,
            Cantidad = i.Cantidad,
            PrecioUnitario = i.PrecioUnitario
        }).ToList(),
        ClienteNombre = cliente?.Nombre,
        ClienteEmail = cliente?.Email
    };
}
