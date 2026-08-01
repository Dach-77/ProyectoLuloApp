using System.Text;
using LuloApp.Api.Data;
using LuloApp.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

// Falla rápido y con un mensaje claro si falta alguna clave requerida, en vez de un
// error confuso más adelante (p. ej. NullReferenceException al firmar un JWT).
foreach (var clave in new[]
{
    "ConnectionStrings:LuloAppDb",
    "Jwt:Key",
    "Jwt:Issuer",
    "Jwt:Audience",
    "Jwt:ExpiryMinutes",
    "AdminUser:Username",
    "AdminUser:PasswordHash"
})
{
    if (string.IsNullOrWhiteSpace(builder.Configuration[clave]))
    {
        throw new InvalidOperationException($"Falta configurar '{clave}' (appsettings/user-secrets/variables de entorno).");
    }
}

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    var esquemaJwt = new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description = "Ingresa el token JWT obtenido en /api/auth/login."
    };
    options.AddSecurityDefinition("Bearer", esquemaJwt);
    options.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        { esquemaJwt, Array.Empty<string>() }
    });
});

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("LuloAppDb")));

builder.Services.AddScoped<ImageStorageService>();

builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection("Jwt"));
builder.Services.AddSingleton<JwtTokenService>();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var jwt = builder.Configuration.GetSection("Jwt");
        options.RequireHttpsMetadata = !builder.Environment.IsDevelopment();
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwt["Issuer"],
            ValidAudience = jwt["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt["Key"]!))
        };
    });
builder.Services.AddAuthorization();

// Protege el login de admin y el login/registro de clientes contra fuerza bruta.
// Partición por IP (no el overload AddFixedWindowLimiter a secas): ese overload usa una
// única ventana GLOBAL compartida por todos los clientes, así que un solo atacante (o
// incluso un solo cliente con reintentos) agotaba el cupo de TODOS los usuarios del sitio
// que intentaran loguearse o registrarse al mismo tiempo.
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("login", context => RateLimitPartition.GetFixedWindowLimiter(
        partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "sin-ip",
        factory: _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 5,
            Window = TimeSpan.FromMinutes(1),
            QueueLimit = 0
        }));
});

const string ConfiguredCors = "ConfiguredCors";
builder.Services.AddCors(options =>
{
    options.AddPolicy(ConfiguredCors, policy =>
    {
        var origenesPermitidos = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();
        policy.WithOrigins(origenesPermitidos)
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

// Fuera de Development, cualquier excepción no controlada devuelve un JSON genérico
// en vez de una página de error / stack trace. Los errores esperables (imagen inválida,
// stockJson malformado) ya se manejan como 400 más abajo en el pipeline de controllers.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler(errorApp =>
    {
        errorApp.Run(async context =>
        {
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsync("{\"error\":\"Ha ocurrido un error inesperado.\"}");
        });
    });
}

app.UseHttpsRedirection();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors(ConfiguredCors);

// El proveedor de tipos MIME por defecto no conoce .avif/.webp: sin esto, UseStaticFiles
// descarta esos archivos silenciosamente y el endpoint termina en 404.
var proveedorTiposMime = new FileExtensionContentTypeProvider();
proveedorTiposMime.Mappings[".avif"] = "image/avif";
proveedorTiposMime.Mappings[".webp"] = "image/webp";

app.UseStaticFiles(new StaticFileOptions
{
    ContentTypeProvider = proveedorTiposMime
}); // sirve wwwroot/imagenes con las fotos subidas desde el panel de admin

app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
