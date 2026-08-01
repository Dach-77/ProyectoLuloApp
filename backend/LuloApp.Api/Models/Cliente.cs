namespace LuloApp.Api.Models;

public class Cliente
{
    public Guid Id { get; set; }
    public string Nombre { get; set; } = string.Empty;

    // Siempre se guarda en minúsculas para que la búsqueda/unicidad no dependa de mayúsculas
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public DateTime FechaRegistro { get; set; } = DateTime.UtcNow;

    public List<Pedido> Pedidos { get; set; } = new();
}
