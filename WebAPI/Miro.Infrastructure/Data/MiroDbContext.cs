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
        public DbSet<Board> Boards { get; set; }
        public DbSet<BoardElement> BoardElements { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Board>()
                .HasMany(b => b.Elements)
                .WithOne(e => e.Board)
                .HasForeignKey(e => e.BoardId);
        }
    }
}
