using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LuloApp.Api.Migrations
{
    /// <inheritdoc />
    public partial class AgregarImagenesPorColor : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ProductoImagenesColor",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProductoId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Color = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    ImagenUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductoImagenesColor", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProductoImagenesColor_Productos_ProductoId",
                        column: x => x.ProductoId,
                        principalTable: "Productos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ProductoImagenesColor_ProductoId_Color",
                table: "ProductoImagenesColor",
                columns: new[] { "ProductoId", "Color" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ProductoImagenesColor");
        }
    }
}
