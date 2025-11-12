using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CollaborativeWhiteboard.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Username = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Email = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    PasswordHash = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FirstName = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    LastName = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LastLoginAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Boards",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    OwnerId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsPublic = table.Column<bool>(type: "bit", nullable: false),
                    ThumbnailUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Boards", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Boards_Users_OwnerId",
                        column: x => x.OwnerId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "BoardCollaborators",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    BoardId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Permission = table.Column<int>(type: "int", nullable: false),
                    AddedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    AddedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BoardCollaborators", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BoardCollaborators_Boards_BoardId",
                        column: x => x.BoardId,
                        principalTable: "Boards",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_BoardCollaborators_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "BoardElements",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    BoardId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Type = table.Column<int>(type: "int", nullable: false),
                    X = table.Column<double>(type: "float", nullable: false),
                    Y = table.Column<double>(type: "float", nullable: false),
                    Width = table.Column<double>(type: "float", nullable: false),
                    Height = table.Column<double>(type: "float", nullable: false),
                    Rotation = table.Column<double>(type: "float", nullable: false),
                    ZIndex = table.Column<int>(type: "int", nullable: false),
                    BackgroundColor = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    BorderColor = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    BorderWidth = table.Column<double>(type: "float", nullable: false),
                    TextColor = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    FontFamily = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    FontSize = table.Column<double>(type: "float", nullable: false),
                    FontWeight = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    FontStyle = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    TextContent = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ImageUrl = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ConnectedFromElementId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ConnectedToElementId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ConnectorStyle = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    PathData = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsLocked = table.Column<bool>(type: "bit", nullable: false),
                    CreatorId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BoardElements", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BoardElements_Boards_BoardId",
                        column: x => x.BoardId,
                        principalTable: "Boards",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_BoardElements_Users_CreatorId",
                        column: x => x.CreatorId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BoardCollaborators_BoardId_UserId",
                table: "BoardCollaborators",
                columns: new[] { "BoardId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_BoardCollaborators_UserId",
                table: "BoardCollaborators",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_BoardElements_BoardId",
                table: "BoardElements",
                column: "BoardId");

            migrationBuilder.CreateIndex(
                name: "IX_BoardElements_CreatedBy",
                table: "BoardElements",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_BoardElements_CreatorId",
                table: "BoardElements",
                column: "CreatorId");

            migrationBuilder.CreateIndex(
                name: "IX_Boards_OwnerId",
                table: "Boards",
                column: "OwnerId");

            migrationBuilder.CreateIndex(
                name: "IX_Users_Email",
                table: "Users",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_Username",
                table: "Users",
                column: "Username",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BoardCollaborators");

            migrationBuilder.DropTable(
                name: "BoardElements");

            migrationBuilder.DropTable(
                name: "Boards");

            migrationBuilder.DropTable(
                name: "Users");
        }
    }
}
