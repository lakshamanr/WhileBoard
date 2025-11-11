using CollaborativeWhiteboard.Domain.Entities;
using CollaborativeWhiteboard.Domain.Interfaces;
using CollaborativeWhiteboard.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CollaborativeWhiteboard.Infrastructure.Repositories;

public class BoardElementRepository : Repository<BoardElement>, IBoardElementRepository
{
    public BoardElementRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<BoardElement>> GetElementsByBoardIdAsync(Guid boardId)
    {
        return await _dbSet
            .Where(e => e.BoardId == boardId)
            .OrderBy(e => e.ZIndex)
            .ToListAsync();
    }

    public async Task<int> GetMaxZIndexAsync(Guid boardId)
    {
        var elements = await _dbSet
            .Where(e => e.BoardId == boardId)
            .ToListAsync();

        return elements.Any() ? elements.Max(e => e.ZIndex) : 0;
    }

    public async Task DeleteElementsByBoardIdAsync(Guid boardId)
    {
        var elements = await _dbSet.Where(e => e.BoardId == boardId).ToListAsync();
        _dbSet.RemoveRange(elements);
        await _context.SaveChangesAsync();
    }

    public async Task<IEnumerable<BoardElement>> GetElementsByTypeAsync(Guid boardId, ElementType type)
    {
        return await _dbSet
            .Where(e => e.BoardId == boardId && e.Type == type)
            .ToListAsync();
    }
}
