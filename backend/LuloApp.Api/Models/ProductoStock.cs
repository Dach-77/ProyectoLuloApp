namespace LuloApp.Api.Models;

// Unidades disponibles para una combinación específica de talla + color
public class ProductoStock
{
    public Guid Id { get; set; }
    public Guid ProductoId { get; set; }
    public string Talla { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public int Cantidad { get; set; }
}
