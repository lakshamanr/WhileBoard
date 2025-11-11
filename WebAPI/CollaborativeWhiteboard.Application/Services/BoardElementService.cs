using CollaborativeWhiteboard.Application.DTOs;
using CollaborativeWhiteboard.Application.Interfaces;
using CollaborativeWhiteboard.Domain.Entities;
using CollaborativeWhiteboard.Domain.Interfaces;

namespace CollaborativeWhiteboard.Application.Services;

public class BoardElementService : IBoardElementService
{
    private readonly IBoardElementRepository _elementRepository;
    private readonly IBoardRepository _boardRepository;

    public BoardElementService(
        IBoardElementRepository elementRepository,
        IBoardRepository boardRepository)
    {
        _elementRepository = elementRepository;
        _boardRepository = boardRepository;
    }

    public async Task<BoardElementDto> CreateElementAsync(Guid boardId, Guid userId, CreateBoardElementDto createDto)
    {
        await ValidateUserAccessAsync(boardId, userId, PermissionLevel.Editor);

        var maxZIndex = await _elementRepository.GetMaxZIndexAsync(boardId);

        var element = new BoardElement
        {
            Id = Guid.NewGuid(),
            BoardId = boardId,
            Type = Enum.Parse<ElementType>(createDto.Type),
            X = createDto.X,
            Y = createDto.Y,
            Width = createDto.Width,
            Height = createDto.Height,
            Rotation = createDto.Rotation,
            ZIndex = maxZIndex + 1,
            BackgroundColor = createDto.BackgroundColor,
            BorderColor = createDto.BorderColor,
            BorderWidth = createDto.BorderWidth,
            TextColor = createDto.TextColor,
            FontFamily = createDto.FontFamily,
            FontSize = createDto.FontSize,
            FontWeight = createDto.FontWeight,
            FontStyle = createDto.FontStyle,
            TextContent = createDto.TextContent,
            ImageUrl = createDto.ImageUrl,
            ConnectedFromElementId = createDto.ConnectedFromElementId,
            ConnectedToElementId = createDto.ConnectedToElementId,
            ConnectorStyle = createDto.ConnectorStyle,
            PathData = createDto.PathData,
            CreatedBy = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _elementRepository.AddAsync(element);
        return MapToElementDto(element);
    }

    public async Task<BoardElementDto> UpdateElementAsync(Guid elementId, Guid userId, UpdateBoardElementDto updateDto)
    {
        var element = await _elementRepository.GetByIdAsync(elementId);
        if (element == null)
            throw new Exception("Element not found");

        await ValidateUserAccessAsync(element.BoardId, userId, PermissionLevel.Editor);

        if (element.IsLocked && element.CreatedBy != userId)
            throw new Exception("Element is locked");

        // Update properties
        if (updateDto.X.HasValue) element.X = updateDto.X.Value;
        if (updateDto.Y.HasValue) element.Y = updateDto.Y.Value;
        if (updateDto.Width.HasValue) element.Width = updateDto.Width.Value;
        if (updateDto.Height.HasValue) element.Height = updateDto.Height.Value;
        if (updateDto.Rotation.HasValue) element.Rotation = updateDto.Rotation.Value;
        if (updateDto.ZIndex.HasValue) element.ZIndex = updateDto.ZIndex.Value;
        if (updateDto.BackgroundColor != null) element.BackgroundColor = updateDto.BackgroundColor;
        if (updateDto.BorderColor != null) element.BorderColor = updateDto.BorderColor;
        if (updateDto.BorderWidth.HasValue) element.BorderWidth = updateDto.BorderWidth.Value;
        if (updateDto.TextColor != null) element.TextColor = updateDto.TextColor;
        if (updateDto.FontFamily != null) element.FontFamily = updateDto.FontFamily;
        if (updateDto.FontSize.HasValue) element.FontSize = updateDto.FontSize.Value;
        if (updateDto.FontWeight != null) element.FontWeight = updateDto.FontWeight;
        if (updateDto.FontStyle != null) element.FontStyle = updateDto.FontStyle;
        if (updateDto.TextContent != null) element.TextContent = updateDto.TextContent;
        if (updateDto.ImageUrl != null) element.ImageUrl = updateDto.ImageUrl;
        if (updateDto.ConnectedFromElementId.HasValue) element.ConnectedFromElementId = updateDto.ConnectedFromElementId;
        if (updateDto.ConnectedToElementId.HasValue) element.ConnectedToElementId = updateDto.ConnectedToElementId;
        if (updateDto.ConnectorStyle != null) element.ConnectorStyle = updateDto.ConnectorStyle;
        if (updateDto.PathData != null) element.PathData = updateDto.PathData;
        if (updateDto.IsLocked.HasValue) element.IsLocked = updateDto.IsLocked.Value;

        element.UpdatedAt = DateTime.UtcNow;
        await _elementRepository.UpdateAsync(element);

        return MapToElementDto(element);
    }

    public async Task DeleteElementAsync(Guid elementId, Guid userId)
    {
        var element = await _elementRepository.GetByIdAsync(elementId);
        if (element == null)
            throw new Exception("Element not found");

        await ValidateUserAccessAsync(element.BoardId, userId, PermissionLevel.Editor);

        if (element.IsLocked && element.CreatedBy != userId)
            throw new Exception("Element is locked");

        await _elementRepository.DeleteAsync(element);
    }

    public async Task<BoardElementDto?> GetElementByIdAsync(Guid elementId, Guid userId)
    {
        var element = await _elementRepository.GetByIdAsync(elementId);
        if (element == null)
            return null;

        await ValidateUserAccessAsync(element.BoardId, userId, PermissionLevel.Viewer);
        return MapToElementDto(element);
    }

    public async Task<IEnumerable<BoardElementDto>> GetBoardElementsAsync(Guid boardId, Guid userId)
    {
        await ValidateUserAccessAsync(boardId, userId, PermissionLevel.Viewer);

        var elements = await _elementRepository.GetElementsByBoardIdAsync(boardId);
        return elements.Select(MapToElementDto);
    }

    public async Task BatchUpdateElementsAsync(Guid boardId, Guid userId, BatchUpdateElementsDto batchDto)
    {
        await ValidateUserAccessAsync(boardId, userId, PermissionLevel.Editor);

        foreach (var update in batchDto.Elements)
        {
            var element = await _elementRepository.GetByIdAsync(update.Id);
            if (element != null && element.BoardId == boardId)
            {
                element.X = update.X;
                element.Y = update.Y;
                element.UpdatedAt = DateTime.UtcNow;
                await _elementRepository.UpdateAsync(element);
            }
        }
    }

    public async Task BringToFrontAsync(Guid elementId, Guid userId)
    {
        var element = await _elementRepository.GetByIdAsync(elementId);
        if (element == null)
            throw new Exception("Element not found");

        await ValidateUserAccessAsync(element.BoardId, userId, PermissionLevel.Editor);

        var maxZIndex = await _elementRepository.GetMaxZIndexAsync(element.BoardId);
        element.ZIndex = maxZIndex + 1;
        element.UpdatedAt = DateTime.UtcNow;
        await _elementRepository.UpdateAsync(element);
    }

    public async Task SendToBackAsync(Guid elementId, Guid userId)
    {
        var element = await _elementRepository.GetByIdAsync(elementId);
        if (element == null)
            throw new Exception("Element not found");

        await ValidateUserAccessAsync(element.BoardId, userId, PermissionLevel.Editor);

        element.ZIndex = 0;
        element.UpdatedAt = DateTime.UtcNow;
        await _elementRepository.UpdateAsync(element);
    }

    private async Task ValidateUserAccessAsync(Guid boardId, Guid userId, PermissionLevel requiredLevel)
    {
        var board = await _boardRepository.GetByIdAsync(boardId);
        if (board == null)
            throw new Exception("Board not found");

        if (board.OwnerId == userId)
            return;

        var userPermission = await _boardRepository.GetUserPermissionAsync(boardId, userId);
        if (userPermission == null)
            throw new Exception("Access denied");

        if (userPermission < requiredLevel)
            throw new Exception("Insufficient permissions");
    }

    private static BoardElementDto MapToElementDto(BoardElement element)
    {
        return new BoardElementDto
        {
            Id = element.Id,
            BoardId = element.BoardId,
            Type = element.Type.ToString(),
            X = element.X,
            Y = element.Y,
            Width = element.Width,
            Height = element.Height,
            Rotation = element.Rotation,
            ZIndex = element.ZIndex,
            BackgroundColor = element.BackgroundColor,
            BorderColor = element.BorderColor,
            BorderWidth = element.BorderWidth,
            TextColor = element.TextColor,
            FontFamily = element.FontFamily,
            FontSize = element.FontSize,
            FontWeight = element.FontWeight,
            FontStyle = element.FontStyle,
            TextContent = element.TextContent,
            ImageUrl = element.ImageUrl,
            ConnectedFromElementId = element.ConnectedFromElementId,
            ConnectedToElementId = element.ConnectedToElementId,
            ConnectorStyle = element.ConnectorStyle,
            PathData = element.PathData,
            CreatedBy = element.CreatedBy,
            CreatedAt = element.CreatedAt,
            UpdatedAt = element.UpdatedAt,
            IsLocked = element.IsLocked
        };
    }
}
