using CollaborativeWhiteboard.Domain.Entities;

namespace CollaborativeWhiteboard.Domain.Interfaces;

public interface IBoardElementRepository : IRepository<BoardElement>
{
    Task<IEnumerable<BoardElement>> GetElementsByBoardIdAsync(Guid boardId);
    Task<int> GetMaxZIndexAsync(Guid boardId);
    Task DeleteElementsByBoardIdAsync(Guid boardId);
    Task<IEnumerable<BoardElement>> GetElementsByTypeAsync(Guid boardId, ElementType type);
}
