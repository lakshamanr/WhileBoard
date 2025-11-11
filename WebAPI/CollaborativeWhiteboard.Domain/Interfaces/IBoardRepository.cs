using CollaborativeWhiteboard.Domain.Entities;

namespace CollaborativeWhiteboard.Domain.Interfaces;

public interface IBoardRepository : IRepository<Board>
{
    Task<IEnumerable<Board>> GetUserBoardsAsync(Guid userId);
    Task<IEnumerable<Board>> GetSharedBoardsAsync(Guid userId);
    Task<Board?> GetBoardWithElementsAsync(Guid boardId);
    Task<Board?> GetBoardWithCollaboratorsAsync(Guid boardId);
    Task<bool> UserHasAccessAsync(Guid boardId, Guid userId);
    Task<PermissionLevel?> GetUserPermissionAsync(Guid boardId, Guid userId);
}
