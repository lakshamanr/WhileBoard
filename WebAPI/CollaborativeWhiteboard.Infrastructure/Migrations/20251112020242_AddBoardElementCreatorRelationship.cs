using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CollaborativeWhiteboard.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddBoardElementCreatorRelationship : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_BoardElements_Users_CreatorId",
                table: "BoardElements");

            migrationBuilder.DropIndex(
                name: "IX_BoardElements_CreatorId",
                table: "BoardElements");

            migrationBuilder.DropColumn(
                name: "CreatorId",
                table: "BoardElements");

            migrationBuilder.AddForeignKey(
                name: "FK_BoardElements_Users_CreatedBy",
                table: "BoardElements",
                column: "CreatedBy",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_BoardElements_Users_CreatedBy",
                table: "BoardElements");

            migrationBuilder.AddColumn<Guid>(
                name: "CreatorId",
                table: "BoardElements",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateIndex(
                name: "IX_BoardElements_CreatorId",
                table: "BoardElements",
                column: "CreatorId");

            migrationBuilder.AddForeignKey(
                name: "FK_BoardElements_Users_CreatorId",
                table: "BoardElements",
                column: "CreatorId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
