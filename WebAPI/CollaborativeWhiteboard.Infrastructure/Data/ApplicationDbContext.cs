using CollaborativeWhiteboard.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CollaborativeWhiteboard.Infrastructure.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<Board> Boards { get; set; }
    public DbSet<BoardElement> BoardElements { get; set; }
    public DbSet<BoardCollaborator> BoardCollaborators { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User configuration
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Username).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Email).IsRequired().HasMaxLength(100);
            entity.Property(e => e.PasswordHash).IsRequired();
            entity.Property(e => e.FirstName).HasMaxLength(50);
            entity.Property(e => e.LastName).HasMaxLength(50);

            entity.HasIndex(e => e.Email).IsUnique();
            entity.HasIndex(e => e.Username).IsUnique();

            entity.HasMany(e => e.OwnedBoards)
                .WithOne(e => e.Owner)
                .HasForeignKey(e => e.OwnerId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(e => e.BoardCollaborations)
                .WithOne(e => e.User)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Board configuration
        modelBuilder.Entity<Board>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.ThumbnailUrl).HasMaxLength(500);

            entity.HasMany(e => e.Elements)
                .WithOne(e => e.Board)
                .HasForeignKey(e => e.BoardId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(e => e.Collaborators)
                .WithOne(e => e.Board)
                .HasForeignKey(e => e.BoardId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // BoardElement configuration
        modelBuilder.Entity<BoardElement>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Type).IsRequired();
            entity.Property(e => e.BackgroundColor).HasMaxLength(50);
            entity.Property(e => e.BorderColor).HasMaxLength(50);
            entity.Property(e => e.TextColor).HasMaxLength(50);
            entity.Property(e => e.FontFamily).HasMaxLength(50);
            entity.Property(e => e.FontWeight).HasMaxLength(20);
            entity.Property(e => e.FontStyle).HasMaxLength(20);
            entity.Property(e => e.ConnectorStyle).HasMaxLength(20);

            entity.HasIndex(e => e.BoardId);
            entity.HasIndex(e => e.CreatedBy);
        });

        // BoardCollaborator configuration
        modelBuilder.Entity<BoardCollaborator>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Permission).IsRequired();

            entity.HasIndex(e => new { e.BoardId, e.UserId }).IsUnique();
        });
    }
}
