using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace LuloApp.Api.Migrations
{
    /// <inheritdoc />
    public partial class InventarioStockYActivo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "Activo",
                table: "Productos",
                type: "bit",
                nullable: false,
                defaultValue: true);

            migrationBuilder.CreateTable(
                name: "ProductoStock",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProductoId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Talla = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Color = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Cantidad = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductoStock", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProductoStock_Productos_ProductoId",
                        column: x => x.ProductoId,
                        principalTable: "Productos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            // Antes de borrar las tablas viejas, migramos sus combinaciones existentes de
            // talla x color hacia la nueva tabla de stock (cantidad de partida: 10 unidades,
            // el admin la ajusta después desde el panel). Esto evita perder disponibilidad
            // de productos reales que ya existieran en la base de datos al reorganizar.
            migrationBuilder.Sql(@"
                INSERT INTO [ProductoStock] ([Id], [ProductoId], [Talla], [Color], [Cantidad])
                SELECT NEWID(), t.[ProductoId], t.[Valor], c.[Valor], 10
                FROM [ProductoTallas] t
                INNER JOIN [ProductoColores] c ON c.[ProductoId] = t.[ProductoId];
            ");

            migrationBuilder.DropTable(
                name: "ProductoColores");

            migrationBuilder.DropTable(
                name: "ProductoTallas");

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                column: "Activo",
                value: true);

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                column: "Activo",
                value: true);

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                column: "Activo",
                value: true);

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: new Guid("44444444-4444-4444-4444-444444444444"),
                column: "Activo",
                value: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProductoStock_ProductoId_Talla_Color",
                table: "ProductoStock",
                columns: new[] { "ProductoId", "Talla", "Color" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ProductoStock");

            migrationBuilder.DropColumn(
                name: "Activo",
                table: "Productos");

            migrationBuilder.CreateTable(
                name: "ProductoColores",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProductoId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Valor = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductoColores", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProductoColores_Productos_ProductoId",
                        column: x => x.ProductoId,
                        principalTable: "Productos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ProductoTallas",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProductoId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Valor = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductoTallas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProductoTallas_Productos_ProductoId",
                        column: x => x.ProductoId,
                        principalTable: "Productos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "ProductoColores",
                columns: new[] { "Id", "ProductoId", "Valor" },
                values: new object[,]
                {
                    { new Guid("b0000000-0000-0000-0000-000000000001"), new Guid("11111111-1111-1111-1111-111111111111"), "Blanco" },
                    { new Guid("b0000000-0000-0000-0000-000000000002"), new Guid("11111111-1111-1111-1111-111111111111"), "Crema" },
                    { new Guid("b0000000-0000-0000-0000-000000000003"), new Guid("22222222-2222-2222-2222-222222222222"), "Azul Oscuro" },
                    { new Guid("b0000000-0000-0000-0000-000000000004"), new Guid("33333333-3333-3333-3333-333333333333"), "Azul Claro" },
                    { new Guid("b0000000-0000-0000-0000-000000000005"), new Guid("44444444-4444-4444-4444-444444444444"), "Pastel" },
                    { new Guid("b0000000-0000-0000-0000-000000000006"), new Guid("44444444-4444-4444-4444-444444444444"), "Multicolor" }
                });

            migrationBuilder.InsertData(
                table: "ProductoTallas",
                columns: new[] { "Id", "ProductoId", "Valor" },
                values: new object[,]
                {
                    { new Guid("a0000000-0000-0000-0000-000000000001"), new Guid("11111111-1111-1111-1111-111111111111"), "S" },
                    { new Guid("a0000000-0000-0000-0000-000000000002"), new Guid("11111111-1111-1111-1111-111111111111"), "M" },
                    { new Guid("a0000000-0000-0000-0000-000000000003"), new Guid("11111111-1111-1111-1111-111111111111"), "L" },
                    { new Guid("a0000000-0000-0000-0000-000000000004"), new Guid("11111111-1111-1111-1111-111111111111"), "XL" },
                    { new Guid("a0000000-0000-0000-0000-000000000005"), new Guid("22222222-2222-2222-2222-222222222222"), "S" },
                    { new Guid("a0000000-0000-0000-0000-000000000006"), new Guid("22222222-2222-2222-2222-222222222222"), "M" },
                    { new Guid("a0000000-0000-0000-0000-000000000007"), new Guid("22222222-2222-2222-2222-222222222222"), "L" },
                    { new Guid("a0000000-0000-0000-0000-000000000008"), new Guid("22222222-2222-2222-2222-222222222222"), "XL" },
                    { new Guid("a0000000-0000-0000-0000-000000000009"), new Guid("33333333-3333-3333-3333-333333333333"), "S" },
                    { new Guid("a0000000-0000-0000-0000-000000000010"), new Guid("33333333-3333-3333-3333-333333333333"), "M" },
                    { new Guid("a0000000-0000-0000-0000-000000000011"), new Guid("33333333-3333-3333-3333-333333333333"), "L" },
                    { new Guid("a0000000-0000-0000-0000-000000000012"), new Guid("33333333-3333-3333-3333-333333333333"), "XL" },
                    { new Guid("a0000000-0000-0000-0000-000000000013"), new Guid("44444444-4444-4444-4444-444444444444"), "S" },
                    { new Guid("a0000000-0000-0000-0000-000000000014"), new Guid("44444444-4444-4444-4444-444444444444"), "M" },
                    { new Guid("a0000000-0000-0000-0000-000000000015"), new Guid("44444444-4444-4444-4444-444444444444"), "L" },
                    { new Guid("a0000000-0000-0000-0000-000000000016"), new Guid("44444444-4444-4444-4444-444444444444"), "XL" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_ProductoColores_ProductoId",
                table: "ProductoColores",
                column: "ProductoId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductoTallas_ProductoId",
                table: "ProductoTallas",
                column: "ProductoId");
        }
    }
}
