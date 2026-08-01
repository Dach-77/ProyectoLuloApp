namespace LuloApp.Api.Models;

public class Pedido
{
    public Guid Id { get; set; }
    public Guid ClienteId { get; set; }
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
    public decimal Total { get; set; }

    // Único valor por ahora: no hay pasarela de pago real, el "pago" se simula y
    // el pedido queda directamente confirmado si el descuento de stock tuvo éxito.
    public string Estado { get; set; } = "Confirmado";

    public List<PedidoItem> Items { get; set; } = new();
}
