using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Miro.Domain.Entities;

namespace Miro.Infrastructure.Data
{
    public class ApplicationDbContext : IdentityDbContext<User>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        public DbSet<Board> Boards { get; set; }
        public DbSet<BoardElement> BoardElements { get; set; }
        public DbSet<Shape> Shapes { get; set; }
        public DbSet<Text> Texts { get; set; }
        public DbSet<StickyNote> StickyNotes { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            builder.Entity<Board>()
                .HasOne(b => b.Owner)
                .WithMany()
                .HasForeignKey(b => b.OwnerId);

            builder.Entity<Board>()
                .HasMany(b => b.Elements)
                .WithOne(e => e.Board)
                .HasForeignKey(e => e.BoardId);
        }
    }
}
