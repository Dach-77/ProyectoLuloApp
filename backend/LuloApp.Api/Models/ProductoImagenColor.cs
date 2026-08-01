namespace LuloApp.Api.Models;

// Foto específica para un color de la prenda (opcional): si un color no tiene
// imagen propia, el catálogo usa la foto principal del producto como resguardo.
public class ProductoImagenColor
{
    public Guid Id { get; set; }
    public Guid ProductoId { get; set; }
    public string Color { get; set; } = string.Empty;
    public string ImagenUrl { get; set; } = string.Empty;
}
