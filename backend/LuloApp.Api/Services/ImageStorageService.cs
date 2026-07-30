namespace LuloApp.Api.Services;

public class ImageStorageService
{
    private const long MaxFotoBytes = 5 * 1024 * 1024; // 5 MB

    private static readonly HashSet<string> ExtensionesPermitidas = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".webp", ".avif"
    };

    private static readonly HashSet<string> ContentTypesPermitidos = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg", "image/png", "image/webp", "image/avif"
    };

    private readonly IWebHostEnvironment _env;

    public ImageStorageService(IWebHostEnvironment env)
    {
        _env = env;
    }

    public async Task<string> GuardarAsync(IFormFile foto, HttpRequest request)
    {
        var extension = Path.GetExtension(foto.FileName);

        if (foto.Length == 0)
        {
            throw new InvalidOperationException("La foto de la prenda es obligatoria.");
        }
        if (foto.Length > MaxFotoBytes)
        {
            throw new InvalidOperationException("La imagen supera el tamaño máximo de 5 MB.");
        }
        if (!ExtensionesPermitidas.Contains(extension) || !ContentTypesPermitidos.Contains(foto.ContentType))
        {
            throw new InvalidOperationException("Formato de imagen no permitido. Usa JPG, PNG, WEBP o AVIF.");
        }

        var carpeta = Path.Combine(_env.WebRootPath, "imagenes");
        Directory.CreateDirectory(carpeta);

        var nombreArchivo = $"{Guid.NewGuid()}{extension}";
        var rutaCompleta = Path.Combine(carpeta, nombreArchivo);

        await using (var stream = new FileStream(rutaCompleta, FileMode.Create))
        {
            await foto.CopyToAsync(stream);
        }

        return $"{request.Scheme}://{request.Host}/imagenes/{nombreArchivo}";
    }

    // Solo borra el archivo si es una foto que subimos nosotros a wwwroot/imagenes
    // (las imágenes semilla viven en el proyecto de Angular, no aquí).
    public void BorrarSiEsLocal(string imagenUrl)
    {
        var nombreArchivo = Path.GetFileName(new Uri(imagenUrl, UriKind.RelativeOrAbsolute).IsAbsoluteUri
            ? new Uri(imagenUrl).LocalPath
            : imagenUrl);

        var rutaCompleta = Path.Combine(_env.WebRootPath, "imagenes", nombreArchivo);
        if (File.Exists(rutaCompleta))
        {
            File.Delete(rutaCompleta);
        }
    }
}
