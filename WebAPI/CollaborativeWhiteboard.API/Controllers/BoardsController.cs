using System.Security.Claims;
using CollaborativeWhiteboard.Application.DTOs;
using CollaborativeWhiteboard.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CollaborativeWhiteboard.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class BoardsController : ControllerBase
{
    private readonly IBoardService _boardService;
    private readonly ILogger<BoardsController> _logger;

    public BoardsController(IBoardService boardService, ILogger<BoardsController> logger)
    {
        _boardService = boardService;
        _logger = logger;
    }

    private Guid GetUserId()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return userId != null ? Guid.Parse(userId) : Guid.Empty;
    }

    [HttpPost]
    public async Task<ActionResult<BoardDto>> CreateBoard([FromBody] CreateBoardDto createDto)
    {
        try
        {
            var userId = GetUserId();
            var board = await _boardService.CreateBoardAsync(userId, createDto);
            return CreatedAtAction(nameof(GetBoardById), new { id = board.Id }, board);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating board");
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<BoardDto>>> GetUserBoards()
    {
        try
        {
            var userId = GetUserId();
            var boards = await _boardService.GetUserBoardsAsync(userId);
            return Ok(boards);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user boards");
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("shared")]
    public async Task<ActionResult<IEnumerable<BoardDto>>> GetSharedBoards()
    {
        try
        {
            var userId = GetUserId();
            var boards = await _boardService.GetSharedBoardsAsync(userId);
            return Ok(boards);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting shared boards");
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<BoardDetailDto>> GetBoardById(Guid id)
    {
        try
        {
            var userId = GetUserId();
            var board = await _boardService.GetBoardByIdAsync(id, userId);

            if (board == null)
                return NotFound();

            return Ok(board);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting board");
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<BoardDto>> UpdateBoard(Guid id, [FromBody] UpdateBoardDto updateDto)
    {
        try
        {
            var userId = GetUserId();
            var board = await _boardService.UpdateBoardAsync(id, userId, updateDto);
            return Ok(board);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating board");
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteBoard(Guid id)
    {
        try
        {
            var userId = GetUserId();
            await _boardService.DeleteBoardAsync(id, userId);
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting board");
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("{id}/collaborators")]
    public async Task<ActionResult<IEnumerable<CollaboratorDto>>> GetCollaborators(Guid id)
    {
        try
        {
            var userId = GetUserId();
            var collaborators = await _boardService.GetCollaboratorsAsync(id, userId);
            return Ok(collaborators);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting collaborators");
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{id}/collaborators")]
    public async Task<ActionResult<CollaboratorDto>> AddCollaborator(Guid id, [FromBody] AddCollaboratorDto addDto)
    {
        try
        {
            var userId = GetUserId();
            var collaborator = await _boardService.AddCollaboratorAsync(id, userId, addDto);
            return Ok(collaborator);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding collaborator");
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id}/collaborators/{collaboratorId}")]
    public async Task<ActionResult> UpdateCollaborator(Guid id, Guid collaboratorId, [FromBody] UpdateCollaboratorDto updateDto)
    {
        try
        {
            var userId = GetUserId();
            await _boardService.UpdateCollaboratorAsync(id, userId, collaboratorId, updateDto);
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating collaborator");
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("{id}/collaborators/{collaboratorId}")]
    public async Task<ActionResult> RemoveCollaborator(Guid id, Guid collaboratorId)
    {
        try
        {
            var userId = GetUserId();
            await _boardService.RemoveCollaboratorAsync(id, userId, collaboratorId);
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing collaborator");
            return BadRequest(new { message = ex.Message });
        }
    }
}
