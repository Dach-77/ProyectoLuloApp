namespace LuloApp.Api.Models;

public class Producto
{
    public Guid Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Codigo { get; set; } = string.Empty;
    public decimal Precio { get; set; }
    public string ImagenUrl { get; set; } = string.Empty;
    public string Descripcion { get; set; } = string.Empty;

    // Si está inactivo, no se muestra en el catálogo público pero sigue en el inventario del admin
    public bool Activo { get; set; } = true;

    // Niño, Niña o Unisex
    public string Genero { get; set; } = "Unisex";

    // Usada para ordenar "últimos productos agregados" en el carrusel de Inicio
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

    // Materiales disponibles (sin control de stock por material)
    public List<ProductoMaterial> Materiales { get; set; } = new();

    // Temporadas a las que pertenece la prenda (una prenda puede tener varias)
    public List<ProductoTemporada> Temporadas { get; set; } = new();

    // Unidades disponibles por cada combinación de talla + color
    public List<ProductoStock> Stock { get; set; } = new();
}
