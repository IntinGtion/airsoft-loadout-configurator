using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LoadoutConfigurator.Api.Migrations
{
    /// <inheritdoc />
    public partial class IntroduceComponentTemplates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MountPoints_Components_ComponentId",
                table: "MountPoints");

            migrationBuilder.DropForeignKey(
                name: "FK_Slots_Components_ComponentId",
                table: "Slots");

            migrationBuilder.DropTable(
                name: "ComponentAcceptedAttachmentType");

            migrationBuilder.DropColumn(
                name: "RealWidthMm",
                table: "Components");

            migrationBuilder.DropColumn(
                name: "SvgAssetPath",
                table: "Components");

            migrationBuilder.RenameColumn(
                name: "ComponentId",
                table: "Slots",
                newName: "ComponentTemplateId");

            migrationBuilder.RenameIndex(
                name: "IX_Slots_ComponentId",
                table: "Slots",
                newName: "IX_Slots_ComponentTemplateId");

            migrationBuilder.RenameColumn(
                name: "ComponentId",
                table: "MountPoints",
                newName: "ComponentTemplateId");

            migrationBuilder.RenameIndex(
                name: "IX_MountPoints_ComponentId",
                table: "MountPoints",
                newName: "IX_MountPoints_ComponentTemplateId");

            migrationBuilder.AddColumn<int>(
                name: "ComponentTemplateId",
                table: "Components",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "ComponentTemplates",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    SvgAssetPath = table.Column<string>(type: "TEXT", nullable: true),
                    RealWidthMm = table.Column<decimal>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ComponentTemplates", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ComponentTemplateAcceptedAttachmentType",
                columns: table => new
                {
                    AcceptedAttachmentTypesId = table.Column<int>(type: "INTEGER", nullable: false),
                    ComponentTemplateId = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ComponentTemplateAcceptedAttachmentType", x => new { x.AcceptedAttachmentTypesId, x.ComponentTemplateId });
                    table.ForeignKey(
                        name: "FK_ComponentTemplateAcceptedAttachmentType_AttachmentTypes_AcceptedAttachmentTypesId",
                        column: x => x.AcceptedAttachmentTypesId,
                        principalTable: "AttachmentTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ComponentTemplateAcceptedAttachmentType_ComponentTemplates_ComponentTemplateId",
                        column: x => x.ComponentTemplateId,
                        principalTable: "ComponentTemplates",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Components_ComponentTemplateId",
                table: "Components",
                column: "ComponentTemplateId");

            migrationBuilder.CreateIndex(
                name: "IX_ComponentTemplateAcceptedAttachmentType_ComponentTemplateId",
                table: "ComponentTemplateAcceptedAttachmentType",
                column: "ComponentTemplateId");

            migrationBuilder.AddForeignKey(
                name: "FK_Components_ComponentTemplates_ComponentTemplateId",
                table: "Components",
                column: "ComponentTemplateId",
                principalTable: "ComponentTemplates",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_MountPoints_ComponentTemplates_ComponentTemplateId",
                table: "MountPoints",
                column: "ComponentTemplateId",
                principalTable: "ComponentTemplates",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Slots_ComponentTemplates_ComponentTemplateId",
                table: "Slots",
                column: "ComponentTemplateId",
                principalTable: "ComponentTemplates",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Components_ComponentTemplates_ComponentTemplateId",
                table: "Components");

            migrationBuilder.DropForeignKey(
                name: "FK_MountPoints_ComponentTemplates_ComponentTemplateId",
                table: "MountPoints");

            migrationBuilder.DropForeignKey(
                name: "FK_Slots_ComponentTemplates_ComponentTemplateId",
                table: "Slots");

            migrationBuilder.DropTable(
                name: "ComponentTemplateAcceptedAttachmentType");

            migrationBuilder.DropTable(
                name: "ComponentTemplates");

            migrationBuilder.DropIndex(
                name: "IX_Components_ComponentTemplateId",
                table: "Components");

            migrationBuilder.DropColumn(
                name: "ComponentTemplateId",
                table: "Components");

            migrationBuilder.RenameColumn(
                name: "ComponentTemplateId",
                table: "Slots",
                newName: "ComponentId");

            migrationBuilder.RenameIndex(
                name: "IX_Slots_ComponentTemplateId",
                table: "Slots",
                newName: "IX_Slots_ComponentId");

            migrationBuilder.RenameColumn(
                name: "ComponentTemplateId",
                table: "MountPoints",
                newName: "ComponentId");

            migrationBuilder.RenameIndex(
                name: "IX_MountPoints_ComponentTemplateId",
                table: "MountPoints",
                newName: "IX_MountPoints_ComponentId");

            migrationBuilder.AddColumn<decimal>(
                name: "RealWidthMm",
                table: "Components",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SvgAssetPath",
                table: "Components",
                type: "TEXT",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ComponentAcceptedAttachmentType",
                columns: table => new
                {
                    AcceptedAttachmentTypesId = table.Column<int>(type: "INTEGER", nullable: false),
                    ComponentId = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ComponentAcceptedAttachmentType", x => new { x.AcceptedAttachmentTypesId, x.ComponentId });
                    table.ForeignKey(
                        name: "FK_ComponentAcceptedAttachmentType_AttachmentTypes_AcceptedAttachmentTypesId",
                        column: x => x.AcceptedAttachmentTypesId,
                        principalTable: "AttachmentTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ComponentAcceptedAttachmentType_Components_ComponentId",
                        column: x => x.ComponentId,
                        principalTable: "Components",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ComponentAcceptedAttachmentType_ComponentId",
                table: "ComponentAcceptedAttachmentType",
                column: "ComponentId");

            migrationBuilder.AddForeignKey(
                name: "FK_MountPoints_Components_ComponentId",
                table: "MountPoints",
                column: "ComponentId",
                principalTable: "Components",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Slots_Components_ComponentId",
                table: "Slots",
                column: "ComponentId",
                principalTable: "Components",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
