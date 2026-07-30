namespace LuloApp.Api.Models;

public class ProductoMaterial
{
    public Guid Id { get; set; }
    public Guid ProductoId { get; set; }
    public string Valor { get; set; } = string.Empty;
}
