using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace LuloApp.Api.Migrations
{
    /// <inheritdoc />
    public partial class InicialProductos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Productos",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Nombre = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    Codigo = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Material = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Tallas = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Precio = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    ImagenUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Descripcion = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Productos", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "Productos",
                columns: new[] { "Id", "Codigo", "Descripcion", "ImagenUrl", "Material", "Nombre", "Precio", "Tallas" },
                values: new object[,]
                {
                    { new Guid("11111111-1111-1111-1111-111111111111"), "VES-01", "Saco blanco de niña.", "/imagenes/saco_blanco.avif", "Lino", "Saco Lulo Spring", 85000m, "S,M,L,XL" },
                    { new Guid("22222222-2222-2222-2222-222222222222"), "CHA-02", "Chaqueta de jean clásica que combina con todo.", "/imagenes/saco_azul_oscuro.webp", "Lana", "Saco Azul Oscuro", 120000m, "S,M,L,XL" },
                    { new Guid("33333333-3333-3333-3333-333333333333"), "CHA-02", "Chaqueta de jean clásica que combina con todo.", "/imagenes/saco_azul_claro.avif", "Lana", "Saco Azul Claro", 120000m, "S,M,L,XL" },
                    { new Guid("44444444-4444-4444-4444-444444444444"), "CHA-02", "Chaqueta de jean clásica que combina con todo.", "/imagenes/camisa_pastel.avif", "Lino", "Camisa Nube", 120000m, "S,M,L,XL" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Productos");
        }
    }
}
