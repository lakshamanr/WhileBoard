using CollaborativeWhiteboard.Application.DTOs;
using CollaborativeWhiteboard.Application.Services;
using CollaborativeWhiteboard.Domain.Entities;
using CollaborativeWhiteboard.Domain.Interfaces;
using Moq;
using Xunit;

namespace CollaborativeWhiteboard.Tests.Services;

public class BoardServiceTests
{
    private readonly Mock<IBoardRepository> _mockBoardRepo;
    private readonly Mock<IUserRepository> _mockUserRepo;
    private readonly Mock<IBoardCollaboratorRepository> _mockCollaboratorRepo;
    private readonly BoardService _boardService;

    public BoardServiceTests()
    {
        _mockBoardRepo = new Mock<IBoardRepository>();
        _mockUserRepo = new Mock<IUserRepository>();
        _mockCollaboratorRepo = new Mock<IBoardCollaboratorRepository>();
        _boardService = new BoardService(_mockBoardRepo.Object, _mockUserRepo.Object, _mockCollaboratorRepo.Object);
    }

    [Fact]
    public async Task CreateBoard_ValidRequest_ReturnsBoard()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var createDto = new CreateBoardDto
        {
            Name = "Test Board",
            Description = "Test Description",
            IsPublic = false
        };

        var user = new User
        {
            Id = userId,
            Username = "testuser",
            Email = "test@test.com"
        };

        _mockUserRepo.Setup(r => r.GetByIdAsync(userId))
            .ReturnsAsync(user);

        _mockBoardRepo.Setup(r => r.AddAsync(It.IsAny<Board>()))
            .ReturnsAsync((Board b) => b);

        // Act
        var result = await _boardService.CreateBoardAsync(userId, createDto);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Test Board", result.Name);
        Assert.Equal("Test Description", result.Description);
        Assert.Equal(userId, result.OwnerId);
        _mockBoardRepo.Verify(r => r.AddAsync(It.IsAny<Board>()), Times.Once);
    }

    [Fact]
    public async Task GetUserBoards_ReturnsUserBoards()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var boards = new List<Board>
        {
            new Board { Id = Guid.NewGuid(), Name = "Board 1", OwnerId = userId },
            new Board { Id = Guid.NewGuid(), Name = "Board 2", OwnerId = userId }
        };

        var user = new User { Id = userId, Username = "testuser" };

        _mockBoardRepo.Setup(r => r.GetUserBoardsAsync(userId))
            .ReturnsAsync(boards);

        _mockUserRepo.Setup(r => r.GetByIdAsync(userId))
            .ReturnsAsync(user);

        // Act
        var result = await _boardService.GetUserBoardsAsync(userId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Count());
        _mockBoardRepo.Verify(r => r.GetUserBoardsAsync(userId), Times.Once);
    }

    [Fact]
    public async Task DeleteBoard_NotOwner_ThrowsException()
    {
        // Arrange
        var ownerId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var boardId = Guid.NewGuid();

        var board = new Board
        {
            Id = boardId,
            OwnerId = ownerId,
            Name = "Test Board"
        };

        _mockBoardRepo.Setup(r => r.GetByIdAsync(boardId))
            .ReturnsAsync(board);

        // Act & Assert
        await Assert.ThrowsAsync<Exception>(() =>
            _boardService.DeleteBoardAsync(boardId, userId));

        _mockBoardRepo.Verify(r => r.DeleteAsync(It.IsAny<Board>()), Times.Never);
    }
}
