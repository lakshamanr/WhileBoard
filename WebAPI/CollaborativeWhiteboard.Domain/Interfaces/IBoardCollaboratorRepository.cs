using CollaborativeWhiteboard.Domain.Entities;

namespace CollaborativeWhiteboard.Domain.Interfaces;

public interface IBoardCollaboratorRepository : IRepository<BoardCollaborator>
{
    Task<IEnumerable<BoardCollaborator>> GetBoardCollaboratorsAsync(Guid boardId);
    Task<BoardCollaborator?> GetCollaboratorAsync(Guid boardId, Guid userId);
    Task RemoveCollaboratorAsync(Guid boardId, Guid userId);
}
