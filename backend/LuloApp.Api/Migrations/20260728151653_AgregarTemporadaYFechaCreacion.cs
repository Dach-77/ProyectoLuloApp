using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace LuloApp.Api.Migrations
{
    /// <inheritdoc />
    public partial class AgregarTemporadaYFechaCreacion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "FechaCreacion",
                table: "Productos",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.CreateTable(
                name: "ProductoTemporadas",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProductoId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Valor = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductoTemporadas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProductoTemporadas_Productos_ProductoId",
                        column: x => x.ProductoId,
                        principalTable: "Productos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "ProductoTemporadas",
                columns: new[] { "Id", "ProductoId", "Valor" },
                values: new object[,]
                {
                    { new Guid("d0000000-0000-0000-0000-000000000001"), new Guid("11111111-1111-1111-1111-111111111111"), "Primavera" },
                    { new Guid("d0000000-0000-0000-0000-000000000002"), new Guid("22222222-2222-2222-2222-222222222222"), "Invierno" },
                    { new Guid("d0000000-0000-0000-0000-000000000003"), new Guid("22222222-2222-2222-2222-222222222222"), "Otoño" },
                    { new Guid("d0000000-0000-0000-0000-000000000004"), new Guid("33333333-3333-3333-3333-333333333333"), "Verano" },
                    { new Guid("d0000000-0000-0000-0000-000000000005"), new Guid("44444444-4444-4444-4444-444444444444"), "Verano" }
                });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                column: "FechaCreacion",
                value: new DateTime(2026, 7, 1, 0, 0, 0, 0, DateTimeKind.Utc));

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                column: "FechaCreacion",
                value: new DateTime(2026, 7, 10, 0, 0, 0, 0, DateTimeKind.Utc));

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                column: "FechaCreacion",
                value: new DateTime(2026, 7, 15, 0, 0, 0, 0, DateTimeKind.Utc));

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: new Guid("44444444-4444-4444-4444-444444444444"),
                column: "FechaCreacion",
                value: new DateTime(2026, 7, 20, 0, 0, 0, 0, DateTimeKind.Utc));

            migrationBuilder.CreateIndex(
                name: "IX_ProductoTemporadas_ProductoId",
                table: "ProductoTemporadas",
                column: "ProductoId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ProductoTemporadas");

            migrationBuilder.DropColumn(
                name: "FechaCreacion",
                table: "Productos");
        }
    }
}
