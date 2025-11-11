using System.Security.Claims;
using CollaborativeWhiteboard.Application.DTOs;
using CollaborativeWhiteboard.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CollaborativeWhiteboard.API.Controllers;

[Authorize]
[ApiController]
[Route("api/boards/{boardId}/elements")]
public class BoardElementsController : ControllerBase
{
    private readonly IBoardElementService _elementService;
    private readonly ILogger<BoardElementsController> _logger;

    public BoardElementsController(IBoardElementService elementService, ILogger<BoardElementsController> logger)
    {
        _elementService = elementService;
        _logger = logger;
    }

    private Guid GetUserId()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return userId != null ? Guid.Parse(userId) : Guid.Empty;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<BoardElementDto>>> GetBoardElements(Guid boardId)
    {
        try
        {
            var userId = GetUserId();
            var elements = await _elementService.GetBoardElementsAsync(boardId, userId);
            return Ok(elements);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting board elements");
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<BoardElementDto>> GetElementById(Guid boardId, Guid id)
    {
        try
        {
            var userId = GetUserId();
            var element = await _elementService.GetElementByIdAsync(id, userId);

            if (element == null)
                return NotFound();

            return Ok(element);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting element");
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost]
    public async Task<ActionResult<BoardElementDto>> CreateElement(Guid boardId, [FromBody] CreateBoardElementDto createDto)
    {
        try
        {
            var userId = GetUserId();
            var element = await _elementService.CreateElementAsync(boardId, userId, createDto);
            return CreatedAtAction(nameof(GetElementById), new { boardId, id = element.Id }, element);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating element");
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<BoardElementDto>> UpdateElement(Guid boardId, Guid id, [FromBody] UpdateBoardElementDto updateDto)
    {
        try
        {
            var userId = GetUserId();
            var element = await _elementService.UpdateElementAsync(id, userId, updateDto);
            return Ok(element);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating element");
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteElement(Guid boardId, Guid id)
    {
        try
        {
            var userId = GetUserId();
            await _elementService.DeleteElementAsync(id, userId);
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting element");
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("batch-update")]
    public async Task<ActionResult> BatchUpdateElements(Guid boardId, [FromBody] BatchUpdateElementsDto batchDto)
    {
        try
        {
            var userId = GetUserId();
            await _elementService.BatchUpdateElementsAsync(boardId, userId, batchDto);
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error batch updating elements");
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{id}/bring-to-front")]
    public async Task<ActionResult> BringToFront(Guid boardId, Guid id)
    {
        try
        {
            var userId = GetUserId();
            await _elementService.BringToFrontAsync(id, userId);
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error bringing element to front");
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{id}/send-to-back")]
    public async Task<ActionResult> SendToBack(Guid boardId, Guid id)
    {
        try
        {
            var userId = GetUserId();
            await _elementService.SendToBackAsync(id, userId);
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending element to back");
            return BadRequest(new { message = ex.Message });
        }
    }
}
