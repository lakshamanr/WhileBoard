using CollaborativeWhiteboard.Application.DTOs;

namespace CollaborativeWhiteboard.Application.Interfaces;

public interface IBoardElementService
{
    Task<BoardElementDto> CreateElementAsync(Guid boardId, Guid userId, CreateBoardElementDto createDto);
    Task<BoardElementDto> UpdateElementAsync(Guid elementId, Guid userId, UpdateBoardElementDto updateDto);
    Task DeleteElementAsync(Guid elementId, Guid userId);
    Task<BoardElementDto?> GetElementByIdAsync(Guid elementId, Guid userId);
    Task<IEnumerable<BoardElementDto>> GetBoardElementsAsync(Guid boardId, Guid userId);
    Task BatchUpdateElementsAsync(Guid boardId, Guid userId, BatchUpdateElementsDto batchDto);
    Task BringToFrontAsync(Guid elementId, Guid userId);
    Task SendToBackAsync(Guid elementId, Guid userId);
}
