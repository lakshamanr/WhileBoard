using CollaborativeWhiteboard.Application.DTOs;

namespace CollaborativeWhiteboard.Application.Interfaces;

public interface IBoardService
{
    Task<BoardDto> CreateBoardAsync(Guid userId, CreateBoardDto createDto);
    Task<BoardDto> UpdateBoardAsync(Guid boardId, Guid userId, UpdateBoardDto updateDto);
    Task DeleteBoardAsync(Guid boardId, Guid userId);
    Task<BoardDetailDto?> GetBoardByIdAsync(Guid boardId, Guid userId);
    Task<IEnumerable<BoardDto>> GetUserBoardsAsync(Guid userId);
    Task<IEnumerable<BoardDto>> GetSharedBoardsAsync(Guid userId);
    Task<CollaboratorDto> AddCollaboratorAsync(Guid boardId, Guid userId, AddCollaboratorDto addDto);
    Task UpdateCollaboratorAsync(Guid boardId, Guid userId, Guid collaboratorId, UpdateCollaboratorDto updateDto);
    Task RemoveCollaboratorAsync(Guid boardId, Guid userId, Guid collaboratorId);
    Task<IEnumerable<CollaboratorDto>> GetCollaboratorsAsync(Guid boardId, Guid userId);
}
