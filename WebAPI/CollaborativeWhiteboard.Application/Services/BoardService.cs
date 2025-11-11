using CollaborativeWhiteboard.Application.DTOs;
using CollaborativeWhiteboard.Application.Interfaces;
using CollaborativeWhiteboard.Domain.Entities;
using CollaborativeWhiteboard.Domain.Interfaces;

namespace CollaborativeWhiteboard.Application.Services;

public class BoardService : IBoardService
{
    private readonly IBoardRepository _boardRepository;
    private readonly IUserRepository _userRepository;
    private readonly IBoardCollaboratorRepository _collaboratorRepository;

    public BoardService(
        IBoardRepository boardRepository,
        IUserRepository userRepository,
        IBoardCollaboratorRepository collaboratorRepository)
    {
        _boardRepository = boardRepository;
        _userRepository = userRepository;
        _collaboratorRepository = collaboratorRepository;
    }

    public async Task<BoardDto> CreateBoardAsync(Guid userId, CreateBoardDto createDto)
    {
        var board = new Board
        {
            Id = Guid.NewGuid(),
            Name = createDto.Name,
            Description = createDto.Description,
            OwnerId = userId,
            IsPublic = createDto.IsPublic,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _boardRepository.AddAsync(board);

        var user = await _userRepository.GetByIdAsync(userId);
        return MapToBoardDto(board, user?.Username ?? "Unknown");
    }

    public async Task<BoardDto> UpdateBoardAsync(Guid boardId, Guid userId, UpdateBoardDto updateDto)
    {
        var board = await _boardRepository.GetByIdAsync(boardId);
        if (board == null)
            throw new Exception("Board not found");

        await ValidateUserPermissionAsync(boardId, userId, PermissionLevel.Admin);

        if (!string.IsNullOrEmpty(updateDto.Name))
            board.Name = updateDto.Name;

        if (updateDto.Description != null)
            board.Description = updateDto.Description;

        if (updateDto.IsPublic.HasValue)
            board.IsPublic = updateDto.IsPublic.Value;

        if (!string.IsNullOrEmpty(updateDto.ThumbnailUrl))
            board.ThumbnailUrl = updateDto.ThumbnailUrl;

        board.UpdatedAt = DateTime.UtcNow;
        await _boardRepository.UpdateAsync(board);

        var user = await _userRepository.GetByIdAsync(board.OwnerId);
        return MapToBoardDto(board, user?.Username ?? "Unknown");
    }

    public async Task DeleteBoardAsync(Guid boardId, Guid userId)
    {
        var board = await _boardRepository.GetByIdAsync(boardId);
        if (board == null)
            throw new Exception("Board not found");

        if (board.OwnerId != userId)
            throw new Exception("Only the owner can delete the board");

        await _boardRepository.DeleteAsync(board);
    }

    public async Task<BoardDetailDto?> GetBoardByIdAsync(Guid boardId, Guid userId)
    {
        if (!await _boardRepository.UserHasAccessAsync(boardId, userId))
            throw new Exception("Access denied");

        var board = await _boardRepository.GetBoardWithElementsAsync(boardId);
        if (board == null)
            return null;

        var boardWithCollaborators = await _boardRepository.GetBoardWithCollaboratorsAsync(boardId);

        var user = await _userRepository.GetByIdAsync(board.OwnerId);

        return new BoardDetailDto
        {
            Id = board.Id,
            Name = board.Name,
            Description = board.Description,
            OwnerId = board.OwnerId,
            OwnerName = user?.Username ?? "Unknown",
            CreatedAt = board.CreatedAt,
            UpdatedAt = board.UpdatedAt,
            IsPublic = board.IsPublic,
            ThumbnailUrl = board.ThumbnailUrl,
            Elements = board.Elements.Select(MapToBoardElementDto).ToList(),
            Collaborators = boardWithCollaborators?.Collaborators.Select(MapToCollaboratorDto).ToList() ?? new List<CollaboratorDto>()
        };
    }

    public async Task<IEnumerable<BoardDto>> GetUserBoardsAsync(Guid userId)
    {
        var boards = await _boardRepository.GetUserBoardsAsync(userId);
        var user = await _userRepository.GetByIdAsync(userId);
        return boards.Select(b => MapToBoardDto(b, user?.Username ?? "Unknown"));
    }

    public async Task<IEnumerable<BoardDto>> GetSharedBoardsAsync(Guid userId)
    {
        var boards = await _boardRepository.GetSharedBoardsAsync(userId);
        var result = new List<BoardDto>();

        foreach (var board in boards)
        {
            var owner = await _userRepository.GetByIdAsync(board.OwnerId);
            result.Add(MapToBoardDto(board, owner?.Username ?? "Unknown"));
        }

        return result;
    }

    public async Task<CollaboratorDto> AddCollaboratorAsync(Guid boardId, Guid userId, AddCollaboratorDto addDto)
    {
        await ValidateUserPermissionAsync(boardId, userId, PermissionLevel.Admin);

        var collaboratorUser = await _userRepository.GetByEmailAsync(addDto.Email);
        if (collaboratorUser == null)
            throw new Exception("User not found");

        var existingCollaborator = await _collaboratorRepository.GetCollaboratorAsync(boardId, collaboratorUser.Id);
        if (existingCollaborator != null)
            throw new Exception("User is already a collaborator");

        var permission = Enum.Parse<PermissionLevel>(addDto.Permission);
        var collaborator = new BoardCollaborator
        {
            Id = Guid.NewGuid(),
            BoardId = boardId,
            UserId = collaboratorUser.Id,
            Permission = permission,
            AddedAt = DateTime.UtcNow,
            AddedBy = userId
        };

        await _collaboratorRepository.AddAsync(collaborator);

        return new CollaboratorDto
        {
            UserId = collaboratorUser.Id,
            Username = collaboratorUser.Username,
            Email = collaboratorUser.Email,
            Permission = permission.ToString(),
            AddedAt = collaborator.AddedAt
        };
    }

    public async Task UpdateCollaboratorAsync(Guid boardId, Guid userId, Guid collaboratorId, UpdateCollaboratorDto updateDto)
    {
        await ValidateUserPermissionAsync(boardId, userId, PermissionLevel.Admin);

        var collaborator = await _collaboratorRepository.GetCollaboratorAsync(boardId, collaboratorId);
        if (collaborator == null)
            throw new Exception("Collaborator not found");

        collaborator.Permission = Enum.Parse<PermissionLevel>(updateDto.Permission);
        await _collaboratorRepository.UpdateAsync(collaborator);
    }

    public async Task RemoveCollaboratorAsync(Guid boardId, Guid userId, Guid collaboratorId)
    {
        await ValidateUserPermissionAsync(boardId, userId, PermissionLevel.Admin);
        await _collaboratorRepository.RemoveCollaboratorAsync(boardId, collaboratorId);
    }

    public async Task<IEnumerable<CollaboratorDto>> GetCollaboratorsAsync(Guid boardId, Guid userId)
    {
        if (!await _boardRepository.UserHasAccessAsync(boardId, userId))
            throw new Exception("Access denied");

        var collaborators = await _collaboratorRepository.GetBoardCollaboratorsAsync(boardId);
        return collaborators.Select(MapToCollaboratorDto);
    }

    private async Task ValidateUserPermissionAsync(Guid boardId, Guid userId, PermissionLevel requiredLevel)
    {
        var board = await _boardRepository.GetByIdAsync(boardId);
        if (board == null)
            throw new Exception("Board not found");

        if (board.OwnerId == userId)
            return; // Owner has all permissions

        var userPermission = await _boardRepository.GetUserPermissionAsync(boardId, userId);
        if (userPermission == null)
            throw new Exception("Access denied");

        if (userPermission < requiredLevel)
            throw new Exception("Insufficient permissions");
    }

    private static BoardDto MapToBoardDto(Board board, string ownerName)
    {
        return new BoardDto
        {
            Id = board.Id,
            Name = board.Name,
            Description = board.Description,
            OwnerId = board.OwnerId,
            OwnerName = ownerName,
            CreatedAt = board.CreatedAt,
            UpdatedAt = board.UpdatedAt,
            IsPublic = board.IsPublic,
            ThumbnailUrl = board.ThumbnailUrl,
            ElementCount = board.Elements?.Count ?? 0,
            CollaboratorCount = board.Collaborators?.Count ?? 0
        };
    }

    private static BoardElementDto MapToBoardElementDto(BoardElement element)
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

    private static CollaboratorDto MapToCollaboratorDto(BoardCollaborator collaborator)
    {
        return new CollaboratorDto
        {
            UserId = collaborator.UserId,
            Username = collaborator.User?.Username ?? "Unknown",
            Email = collaborator.User?.Email ?? "Unknown",
            Permission = collaborator.Permission.ToString(),
            AddedAt = collaborator.AddedAt
        };
    }
}
