using System.ComponentModel.DataAnnotations;

namespace LuloApp.Api.Dtos;

public class StockDto
{
    public string Talla { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public int Cantidad { get; set; }
}

public class ImagenColorDto
{
    public string Color { get; set; } = string.Empty;
    public string ImagenUrl { get; set; } = string.Empty;
}

public class ProductoDto
{
    public Guid Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Codigo { get; set; } = string.Empty;
    public bool Activo { get; set; }
    public string Genero { get; set; } = string.Empty;
    public DateTime FechaCreacion { get; set; }
    public List<string> Materiales { get; set; } = new();
    public List<string> Temporadas { get; set; } = new();
    public List<string> Tallas { get; set; } = new();
    public List<string> Colores { get; set; } = new();
    public List<StockDto> Stock { get; set; } = new();
    public decimal Precio { get; set; }
    public string ImagenUrl { get; set; } = string.Empty;
    public string Descripcion { get; set; } = string.Empty;
    public List<ImagenColorDto> ImagenesPorColor { get; set; } = new();
}

// Recibido como multipart/form-data desde el panel de administrador. No hay un campo de
// "foto principal": las fotos llegan una por color (ver ExtraerFotosPorColor en
// ProductosController) y la primera subida se usa como imagen de portada del producto.
// Materiales y Temporadas llegan como CSV (ej: "Lino,Algodón" / "Verano,Otoño"); Stock llega como JSON:
// [{"talla":"S","color":"Rojo","cantidad":10}, ...]
public class ProductoFormRequest
{
    [Required, StringLength(150, MinimumLength = 1)]
    public string Nombre { get; set; } = string.Empty;

    [Required, StringLength(50)]
    public string Codigo { get; set; } = string.Empty;

    [Required, RegularExpression("^(Niño|Niña|Unisex)$")]
    public string Genero { get; set; } = "Unisex";

    public string Materiales { get; set; } = string.Empty;
    public string Temporadas { get; set; } = string.Empty;
    public string StockJson { get; set; } = string.Empty;

    [Range(0.01, 99999999.99)]
    public decimal Precio { get; set; }

    [StringLength(1000)]
    public string? Descripcion { get; set; }
}

public class StockItemRequest
{
    public string Talla { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public int Cantidad { get; set; }
}

public class CambiarEstadoRequest
{
    public bool Activo { get; set; }
}
