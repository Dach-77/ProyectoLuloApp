namespace LuloApp.Api.Models;

public class PedidoItem
{
    public Guid Id { get; set; }
    public Guid PedidoId { get; set; }

    // Nullable: el pedido no debe depender de que el producto original siga existiendo.
    public Guid? ProductoId { get; set; }

    // Snapshot al momento de comprar: si el producto cambia de nombre/precio (o se
    // borra) después, el historial de este pedido no debe cambiar retroactivamente.
    public string NombreProducto { get; set; } = string.Empty;
    public string Talla { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public int Cantidad { get; set; }
    public decimal PrecioUnitario { get; set; }
}
