using System.ComponentModel.DataAnnotations;

namespace LuloApp.Api.Dtos;

public class PedidoItemRequest
{
    [Required]
    public Guid ProductoId { get; set; }

    [Required, StringLength(20)]
    public string Talla { get; set; } = string.Empty;

    [Required, StringLength(50)]
    public string Color { get; set; } = string.Empty;

    [Range(1, 1000)]
    public int Cantidad { get; set; }
}

// El precio nunca viaja en el request: siempre se recalcula server-side desde el
// Producto vigente al momento del checkout (ver PedidosController.Crear).
public class CrearPedidoRequest
{
    [Required, MinLength(1)]
    public List<PedidoItemRequest> Items { get; set; } = new();
}

public class PedidoItemDto
{
    public string NombreProducto { get; set; } = string.Empty;
    public string Talla { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public int Cantidad { get; set; }
    public decimal PrecioUnitario { get; set; }
}

public class PedidoDto
{
    public Guid Id { get; set; }
    public DateTime FechaCreacion { get; set; }
    public decimal Total { get; set; }
    public string Estado { get; set; } = string.Empty;
    public List<PedidoItemDto> Items { get; set; } = new();

    // Solo se pueblan en el listado de admin (GET /api/pedidos); quedan null en /mios,
    // donde el cliente autenticado ya sabe quién es.
    public string? ClienteNombre { get; set; }
    public string? ClienteEmail { get; set; }
}

// 409: una o más líneas del carrito no se pudieron confirmar. Se devuelven TODAS las
// líneas con problema de una sola vez (no una por reintento) porque el chequeo ya
// recorre el carrito completo antes de decidir si hace rollback.
public class StockConflictoDto
{
    public string Error { get; set; } = "Uno o más productos del carrito no tienen stock suficiente.";
    public List<StockConflictoItemDto> Items { get; set; } = new();
}

public class StockConflictoItemDto
{
    public Guid ProductoId { get; set; }
    public string Talla { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public int CantidadSolicitada { get; set; }
    public int CantidadDisponible { get; set; }

    // Vocabulario cerrado: "SinStock" | "ProductoInactivo" | "ProductoInexistente"
    public string Motivo { get; set; } = string.Empty;
}
