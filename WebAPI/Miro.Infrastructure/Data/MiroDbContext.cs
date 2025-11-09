using Microsoft.EntityFrameworkCore;
using Miro.Domain.Entities;

namespace Miro.Infrastructure.Data
{
    public class MiroDbContext : DbContext
    {
        public MiroDbContext(DbContextOptions<MiroDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<GuestUser> GuestUsers { get; set; }
        public DbSet<Board> Boards { get; set; }
        public DbSet<BoardPermission> BoardPermissions { get; set; }
        public DbSet<BoardElement> BoardElements { get; set; }
        public DbSet<Shape> Shapes { get; set; }
        public DbSet<Text> Texts { get; set; }
        public DbSet<StickyNote> StickyNotes { get; set; }


        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Board>()
                .HasOne(b => b.Owner)
                .WithMany()
                .HasForeignKey(b => b.OwnerId);

            modelBuilder.Entity<Board>()
                .HasMany(b => b.Elements)
                .WithOne(e => e.Board)
                .HasForeignKey(e => e.BoardId);

            modelBuilder.Entity<BoardElement>()
                .ToTable("BoardElements")
                .HasDiscriminator<string>("ElementType")
                .HasValue<Shape>("Shape")
                .HasValue<Text>("Text")
                .HasValue<StickyNote>("StickyNote");

            modelBuilder.Entity<BoardPermission>()
                .HasOne(bp => bp.Board)
                .WithMany()
                .HasForeignKey(bp => bp.BoardId);

            modelBuilder.Entity<BoardPermission>()
                .HasOne(bp => bp.User)
                .WithMany()
                .HasForeignKey(bp => bp.UserId)
                .OnDelete(DeleteBehavior.NoAction);
        }
    }
}
