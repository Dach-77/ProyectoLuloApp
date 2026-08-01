using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LuloApp.Api.Migrations
{
    /// <inheritdoc />
    public partial class AgregarIndiceUnicoCodigoProducto : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Productos_Codigo",
                table: "Productos",
                column: "Codigo",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Productos_Codigo",
                table: "Productos");
        }
    }
}
