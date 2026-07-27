using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LoadoutConfigurator.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddMountPoints : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "MountPoints",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ComponentId = table.Column<int>(type: "INTEGER", nullable: false),
                    AttachmentTypeId = table.Column<int>(type: "INTEGER", nullable: false),
                    Label = table.Column<string>(type: "TEXT", nullable: false),
                    PositionXPercent = table.Column<float>(type: "REAL", nullable: false),
                    PositionYPercent = table.Column<float>(type: "REAL", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MountPoints", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MountPoints_AttachmentTypes_AttachmentTypeId",
                        column: x => x.AttachmentTypeId,
                        principalTable: "AttachmentTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MountPoints_Components_ComponentId",
                        column: x => x.ComponentId,
                        principalTable: "Components",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MountPoints_AttachmentTypeId",
                table: "MountPoints",
                column: "AttachmentTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_MountPoints_ComponentId",
                table: "MountPoints",
                column: "ComponentId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MountPoints");
        }
    }
}
