using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LoadoutConfigurator.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddRealWidthMm : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "RealWidthMm",
                table: "Components",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RealWidthMm",
                table: "Components");
        }
    }
}
