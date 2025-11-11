using CollaborativeWhiteboard.Domain.Entities;
using CollaborativeWhiteboard.Domain.Interfaces;
using CollaborativeWhiteboard.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CollaborativeWhiteboard.Infrastructure.Repositories;

public class BoardCollaboratorRepository : Repository<BoardCollaborator>, IBoardCollaboratorRepository
{
    public BoardCollaboratorRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<BoardCollaborator>> GetBoardCollaboratorsAsync(Guid boardId)
    {
        return await _dbSet
            .Where(c => c.BoardId == boardId)
            .Include(c => c.User)
            .ToListAsync();
    }

    public async Task<BoardCollaborator?> GetCollaboratorAsync(Guid boardId, Guid userId)
    {
        return await _dbSet
            .Include(c => c.User)
            .FirstOrDefaultAsync(c => c.BoardId == boardId && c.UserId == userId);
    }

    public async Task RemoveCollaboratorAsync(Guid boardId, Guid userId)
    {
        var collaborator = await _dbSet
            .FirstOrDefaultAsync(c => c.BoardId == boardId && c.UserId == userId);

        if (collaborator != null)
        {
            _dbSet.Remove(collaborator);
            await _context.SaveChangesAsync();
        }
    }
}
