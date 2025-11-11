using CollaborativeWhiteboard.Domain.Entities;
using CollaborativeWhiteboard.Domain.Interfaces;
using CollaborativeWhiteboard.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CollaborativeWhiteboard.Infrastructure.Repositories;

public class BoardRepository : Repository<Board>, IBoardRepository
{
    public BoardRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Board>> GetUserBoardsAsync(Guid userId)
    {
        return await _dbSet
            .Where(b => b.OwnerId == userId)
            .Include(b => b.Elements)
            .Include(b => b.Collaborators)
            .OrderByDescending(b => b.UpdatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<Board>> GetSharedBoardsAsync(Guid userId)
    {
        return await _dbSet
            .Where(b => b.Collaborators.Any(c => c.UserId == userId))
            .Include(b => b.Elements)
            .Include(b => b.Collaborators)
            .OrderByDescending(b => b.UpdatedAt)
            .ToListAsync();
    }

    public async Task<Board?> GetBoardWithElementsAsync(Guid boardId)
    {
        return await _dbSet
            .Include(b => b.Elements)
            .FirstOrDefaultAsync(b => b.Id == boardId);
    }

    public async Task<Board?> GetBoardWithCollaboratorsAsync(Guid boardId)
    {
        return await _dbSet
            .Include(b => b.Collaborators)
                .ThenInclude(c => c.User)
            .FirstOrDefaultAsync(b => b.Id == boardId);
    }

    public async Task<bool> UserHasAccessAsync(Guid boardId, Guid userId)
    {
        return await _dbSet.AnyAsync(b =>
            b.Id == boardId &&
            (b.OwnerId == userId ||
             b.Collaborators.Any(c => c.UserId == userId) ||
             b.IsPublic));
    }

    public async Task<PermissionLevel?> GetUserPermissionAsync(Guid boardId, Guid userId)
    {
        var collaborator = await _context.BoardCollaborators
            .FirstOrDefaultAsync(c => c.BoardId == boardId && c.UserId == userId);

        return collaborator?.Permission;
    }
}
