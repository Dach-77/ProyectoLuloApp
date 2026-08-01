using System.ComponentModel.DataAnnotations;

namespace LuloApp.Api.Dtos;

public class ClienteRegistroRequest
{
    [Required, MaxLength(150)]
    public string Nombre { get; set; } = string.Empty;

    [Required, EmailAddress, MaxLength(200)]
    public string Email { get; set; } = string.Empty;

    [Required, MinLength(8), MaxLength(200)]
    public string Password { get; set; } = string.Empty;
}

public class ClienteLoginRequest
{
    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required, MaxLength(200)]
    public string Password { get; set; } = string.Empty;
}

public class ClienteDto
{
    public Guid Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
}

public class ClienteAuthResponse
{
    public string Token { get; set; } = string.Empty;
    public DateTime ExpiresAtUtc { get; set; }
    public ClienteDto Cliente { get; set; } = null!;
}
