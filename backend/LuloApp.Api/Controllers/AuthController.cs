using LuloApp.Api.Dtos;
using LuloApp.Api.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace LuloApp.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IConfiguration _configuration;
    private readonly JwtTokenService _jwtTokenService;
    private static readonly PasswordHasher<object> PasswordHasher = new();

    public AuthController(IConfiguration configuration, JwtTokenService jwtTokenService)
    {
        _configuration = configuration;
        _jwtTokenService = jwtTokenService;
    }

    [HttpPost("login")]
    [EnableRateLimiting("login")]
    public ActionResult<LoginResponse> Login(LoginRequest request)
    {
        var usuarioConfigurado = _configuration["AdminUser:Username"];
        var hashConfigurado = _configuration["AdminUser:PasswordHash"];

        if (!string.Equals(request.Username, usuarioConfigurado, StringComparison.OrdinalIgnoreCase))
        {
            return Unauthorized(new { error = "Usuario o contraseña incorrectos." });
        }

        var resultado = PasswordHasher.VerifyHashedPassword(this, hashConfigurado!, request.Password);
        if (resultado == PasswordVerificationResult.Failed)
        {
            return Unauthorized(new { error = "Usuario o contraseña incorrectos." });
        }

        var (token, expiresAtUtc) = _jwtTokenService.GenerateToken(usuarioConfigurado!, "Admin");
        return Ok(new LoginResponse { Token = token, ExpiresAtUtc = expiresAtUtc });
    }
}
