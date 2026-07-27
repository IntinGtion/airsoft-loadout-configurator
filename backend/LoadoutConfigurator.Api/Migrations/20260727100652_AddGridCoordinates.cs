using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LoadoutConfigurator.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddGridCoordinates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "GridColumn",
                table: "Slots",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "GridRow",
                table: "Slots",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "GridColumn",
                table: "MountPoints",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "GridRow",
                table: "MountPoints",
                type: "INTEGER",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "GridColumn",
                table: "Slots");

            migrationBuilder.DropColumn(
                name: "GridRow",
                table: "Slots");

            migrationBuilder.DropColumn(
                name: "GridColumn",
                table: "MountPoints");

            migrationBuilder.DropColumn(
                name: "GridRow",
                table: "MountPoints");
        }
    }
}
