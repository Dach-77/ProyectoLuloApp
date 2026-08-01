using LuloApp.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace LuloApp.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Producto> Productos => Set<Producto>();
    public DbSet<ProductoMaterial> ProductoMateriales => Set<ProductoMaterial>();
    public DbSet<ProductoTemporada> ProductoTemporadas => Set<ProductoTemporada>();
    public DbSet<ProductoStock> ProductoStock => Set<ProductoStock>();
    public DbSet<ProductoImagenColor> ProductoImagenesColor => Set<ProductoImagenColor>();
    public DbSet<Cliente> Clientes => Set<Cliente>();
    public DbSet<Pedido> Pedidos => Set<Pedido>();
    public DbSet<PedidoItem> PedidoItems => Set<PedidoItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Producto>(entity =>
        {
            entity.ToTable("Productos");
            entity.HasKey(p => p.Id);
            entity.Property(p => p.Nombre).IsRequired().HasMaxLength(150);
            entity.Property(p => p.Codigo).IsRequired().HasMaxLength(50);
            entity.Property(p => p.Precio).HasColumnType("decimal(10,2)");
            entity.Property(p => p.ImagenUrl).HasMaxLength(500);
            entity.Property(p => p.Descripcion).HasMaxLength(1000);
            entity.Property(p => p.Activo).HasDefaultValue(true);
            entity.Property(p => p.Genero).IsRequired().HasMaxLength(20).HasDefaultValue("Unisex");
            entity.Property(p => p.FechaCreacion).IsRequired();

            // Respaldo a nivel de BD del chequeo de unicidad que hace ProductosController:
            // sin esto, dos creaciones concurrentes con el mismo código podían colarse (ventana
            // entre el AnyAsync y el SaveChangesAsync). Requiere que Codigo ya sea único en los
            // datos existentes (ver migración AgregarIndiceUnicoCodigoProducto).
            entity.HasIndex(p => p.Codigo).IsUnique();

            entity.HasMany(p => p.Materiales).WithOne().HasForeignKey(m => m.ProductoId).OnDelete(DeleteBehavior.Cascade);
            entity.HasMany(p => p.Temporadas).WithOne().HasForeignKey(t => t.ProductoId).OnDelete(DeleteBehavior.Cascade);
            entity.HasMany(p => p.Stock).WithOne().HasForeignKey(s => s.ProductoId).OnDelete(DeleteBehavior.Cascade);
            entity.HasMany(p => p.ImagenesPorColor).WithOne().HasForeignKey(i => i.ProductoId).OnDelete(DeleteBehavior.Cascade);

            // A diferencia de las demás relaciones de Producto, esta NO es Cascade: un
            // PedidoItem ya tiene su propio snapshot de nombre/precio, así que borrar el
            // producto no debe borrar el historial de pedidos que lo compraron.
            entity.HasMany(p => p.PedidoItems).WithOne().HasForeignKey(pi => pi.ProductoId).OnDelete(DeleteBehavior.SetNull);

            // Semilla: los mismos 4 productos base (FechaCreacion escalonada para poder
            // verificar el orden del carrusel de "últimos agregados" en Inicio)
            entity.HasData(
                new { Id = new Guid("11111111-1111-1111-1111-111111111111"), Nombre = "Saco Lulo Spring", Codigo = "VES-01", Precio = 85000m, ImagenUrl = "/imagenes/saco_blanco.avif", Descripcion = "Saco blanco de niña.", Activo = true, Genero = "Niña", FechaCreacion = new DateTime(2026, 7, 1, 0, 0, 0, DateTimeKind.Utc) },
                new { Id = new Guid("22222222-2222-2222-2222-222222222222"), Nombre = "Saco Azul Oscuro", Codigo = "CHA-02", Precio = 120000m, ImagenUrl = "/imagenes/saco_azul_oscuro.webp", Descripcion = "Chaqueta de jean clásica que combina con todo.", Activo = true, Genero = "Niño", FechaCreacion = new DateTime(2026, 7, 10, 0, 0, 0, DateTimeKind.Utc) },
                new { Id = new Guid("33333333-3333-3333-3333-333333333333"), Nombre = "Saco Azul Claro", Codigo = "CHA-02", Precio = 120000m, ImagenUrl = "/imagenes/saco_azul_claro.avif", Descripcion = "Chaqueta de jean clásica que combina con todo.", Activo = true, Genero = "Niño", FechaCreacion = new DateTime(2026, 7, 15, 0, 0, 0, DateTimeKind.Utc) },
                new { Id = new Guid("44444444-4444-4444-4444-444444444444"), Nombre = "Camisa Nube", Codigo = "CHA-02", Precio = 120000m, ImagenUrl = "/imagenes/camisa_pastel.avif", Descripcion = "Chaqueta de jean clásica que combina con todo.", Activo = true, Genero = "Unisex", FechaCreacion = new DateTime(2026, 7, 20, 0, 0, 0, DateTimeKind.Utc) }
            );
        });

        modelBuilder.Entity<ProductoMaterial>(entity =>
        {
            entity.ToTable("ProductoMateriales");
            entity.Property(m => m.Valor).IsRequired().HasMaxLength(50);

            entity.HasData(
                new ProductoMaterial { Id = new Guid("c0000000-0000-0000-0000-000000000001"), ProductoId = new Guid("11111111-1111-1111-1111-111111111111"), Valor = "Lino" },
                new ProductoMaterial { Id = new Guid("c0000000-0000-0000-0000-000000000002"), ProductoId = new Guid("22222222-2222-2222-2222-222222222222"), Valor = "Lana" },
                new ProductoMaterial { Id = new Guid("c0000000-0000-0000-0000-000000000003"), ProductoId = new Guid("33333333-3333-3333-3333-333333333333"), Valor = "Lana" },
                new ProductoMaterial { Id = new Guid("c0000000-0000-0000-0000-000000000004"), ProductoId = new Guid("44444444-4444-4444-4444-444444444444"), Valor = "Lino" }
            );
        });

        modelBuilder.Entity<ProductoTemporada>(entity =>
        {
            entity.ToTable("ProductoTemporadas");
            entity.Property(t => t.Valor).IsRequired().HasMaxLength(20);

            entity.HasData(
                new ProductoTemporada { Id = new Guid("d0000000-0000-0000-0000-000000000001"), ProductoId = new Guid("11111111-1111-1111-1111-111111111111"), Valor = "Primavera" },
                new ProductoTemporada { Id = new Guid("d0000000-0000-0000-0000-000000000002"), ProductoId = new Guid("22222222-2222-2222-2222-222222222222"), Valor = "Invierno" },
                new ProductoTemporada { Id = new Guid("d0000000-0000-0000-0000-000000000003"), ProductoId = new Guid("22222222-2222-2222-2222-222222222222"), Valor = "Otoño" },
                new ProductoTemporada { Id = new Guid("d0000000-0000-0000-0000-000000000004"), ProductoId = new Guid("33333333-3333-3333-3333-333333333333"), Valor = "Verano" },
                new ProductoTemporada { Id = new Guid("d0000000-0000-0000-0000-000000000005"), ProductoId = new Guid("44444444-4444-4444-4444-444444444444"), Valor = "Verano" }
            );
        });

        modelBuilder.Entity<ProductoStock>(entity =>
        {
            entity.ToTable("ProductoStock");
            entity.Property(s => s.Talla).IsRequired().HasMaxLength(20);
            entity.Property(s => s.Color).IsRequired().HasMaxLength(50);
            entity.HasIndex(s => new { s.ProductoId, s.Talla, s.Color }).IsUnique();

            // Sin HasData aquí a propósito: las combinaciones talla+color de los productos
            // semilla se migran desde las viejas tablas ProductoTallas/ProductoColores dentro
            // de la migración (ver Up()), junto con las de cualquier producto real que ya
            // existiera en la base de datos al momento de reorganizar el esquema.
        });

        modelBuilder.Entity<ProductoImagenColor>(entity =>
        {
            entity.ToTable("ProductoImagenesColor");
            entity.Property(i => i.Color).IsRequired().HasMaxLength(50);
            entity.Property(i => i.ImagenUrl).IsRequired().HasMaxLength(500);
            entity.HasIndex(i => new { i.ProductoId, i.Color }).IsUnique();
        });

        modelBuilder.Entity<Cliente>(entity =>
        {
            entity.ToTable("Clientes");
            entity.HasKey(c => c.Id);
            entity.Property(c => c.Nombre).IsRequired().HasMaxLength(150);
            entity.Property(c => c.Email).IsRequired().HasMaxLength(200);
            entity.Property(c => c.PasswordHash).IsRequired();
            entity.Property(c => c.FechaRegistro).IsRequired();
            entity.HasIndex(c => c.Email).IsUnique();

            // Restrict (no Cascade): nunca se debe perder el historial de compras de un
            // cliente solo porque se borre su cuenta (hoy tampoco existe ese endpoint).
            entity.HasMany(c => c.Pedidos).WithOne().HasForeignKey(p => p.ClienteId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Pedido>(entity =>
        {
            entity.ToTable("Pedidos");
            entity.HasKey(p => p.Id);
            entity.Property(p => p.Total).HasColumnType("decimal(10,2)");
            entity.Property(p => p.Estado).IsRequired().HasMaxLength(20);
            entity.Property(p => p.FechaCreacion).IsRequired();

            entity.HasMany(p => p.Items).WithOne().HasForeignKey(i => i.PedidoId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<PedidoItem>(entity =>
        {
            entity.ToTable("PedidoItems");
            entity.HasKey(i => i.Id);
            entity.Property(i => i.NombreProducto).IsRequired().HasMaxLength(150);
            entity.Property(i => i.Talla).IsRequired().HasMaxLength(20);
            entity.Property(i => i.Color).IsRequired().HasMaxLength(50);
            entity.Property(i => i.PrecioUnitario).HasColumnType("decimal(10,2)");
        });
    }
}
