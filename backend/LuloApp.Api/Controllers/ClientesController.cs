using LuloApp.Api.Data;
using LuloApp.Api.Dtos;
using LuloApp.Api.Models;
using LuloApp.Api.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace LuloApp.Api.Controllers;

[ApiController]
[Route("api/clientes")]
public class ClientesController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly JwtTokenService _jwtTokenService;
    private static readonly PasswordHasher<Cliente> PasswordHasher = new();

    public ClientesController(AppDbContext context, JwtTokenService jwtTokenService)
    {
        _context = context;
        _jwtTokenService = jwtTokenService;
    }

    [HttpPost("registro")]
    [EnableRateLimiting("login")]
    public async Task<ActionResult<ClienteAuthResponse>> Registrar(ClienteRegistroRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var yaExiste = await _context.Clientes.AnyAsync(c => c.Email == email);
        if (yaExiste)
        {
            return Conflict(new { error = "Ya existe una cuenta con ese correo." });
        }

        var cliente = new Cliente
        {
            Id = Guid.NewGuid(),
            Nombre = request.Nombre.Trim(),
            Email = email,
            FechaRegistro = DateTime.UtcNow
        };
        cliente.PasswordHash = PasswordHasher.HashPassword(cliente, request.Password);

        _context.Clientes.Add(cliente);
        await _context.SaveChangesAsync();

        return Ok(GenerarRespuesta(cliente));
    }

    [HttpPost("login")]
    [EnableRateLimiting("login")]
    public async Task<ActionResult<ClienteAuthResponse>> Login(ClienteLoginRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var cliente = await _context.Clientes.FirstOrDefaultAsync(c => c.Email == email);
        if (cliente is null)
        {
            return Unauthorized(new { error = "Correo o contraseña incorrectos." });
        }

        var resultado = PasswordHasher.VerifyHashedPassword(cliente, cliente.PasswordHash, request.Password);
        if (resultado == PasswordVerificationResult.Failed)
        {
            return Unauthorized(new { error = "Correo o contraseña incorrectos." });
        }

        return Ok(GenerarRespuesta(cliente));
    }

    private ClienteAuthResponse GenerarRespuesta(Cliente cliente)
    {
        var (token, expiresAtUtc) = _jwtTokenService.GenerateToken(cliente.Email, "Cliente", cliente.Id.ToString());
        return new ClienteAuthResponse
        {
            Token = token,
            ExpiresAtUtc = expiresAtUtc,
            Cliente = new ClienteDto { Id = cliente.Id, Nombre = cliente.Nombre, Email = cliente.Email }
        };
    }
}
