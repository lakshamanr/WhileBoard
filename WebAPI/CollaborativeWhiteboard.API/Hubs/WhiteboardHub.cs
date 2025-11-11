using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace CollaborativeWhiteboard.API.Hubs;

[Authorize]
public class WhiteboardHub : Hub
{
    public async Task JoinBoard(string boardId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"board-{boardId}");

        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var username = Context.User?.FindFirst(ClaimTypes.Name)?.Value;

        await Clients.OthersInGroup($"board-{boardId}").SendAsync("UserJoined", new
        {
            UserId = userId,
            Username = username,
            Timestamp = DateTime.UtcNow
        });
    }

    public async Task LeaveBoard(string boardId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"board-{boardId}");

        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var username = Context.User?.FindFirst(ClaimTypes.Name)?.Value;

        await Clients.OthersInGroup($"board-{boardId}").SendAsync("UserLeft", new
        {
            UserId = userId,
            Username = username,
            Timestamp = DateTime.UtcNow
        });
    }

    public async Task ElementCreated(string boardId, object element)
    {
        await Clients.OthersInGroup($"board-{boardId}").SendAsync("ElementCreated", element);
    }

    public async Task ElementUpdated(string boardId, object element)
    {
        await Clients.OthersInGroup($"board-{boardId}").SendAsync("ElementUpdated", element);
    }

    public async Task ElementDeleted(string boardId, string elementId)
    {
        await Clients.OthersInGroup($"board-{boardId}").SendAsync("ElementDeleted", elementId);
    }

    public async Task ElementsUpdated(string boardId, object elements)
    {
        await Clients.OthersInGroup($"board-{boardId}").SendAsync("ElementsUpdated", elements);
    }

    public async Task CursorMoved(string boardId, double x, double y)
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var username = Context.User?.FindFirst(ClaimTypes.Name)?.Value;

        await Clients.OthersInGroup($"board-{boardId}").SendAsync("CursorMoved", new
        {
            UserId = userId,
            Username = username,
            X = x,
            Y = y
        });
    }

    public async Task SendChatMessage(string boardId, string message)
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var username = Context.User?.FindFirst(ClaimTypes.Name)?.Value;

        await Clients.Group($"board-{boardId}").SendAsync("ChatMessage", new
        {
            UserId = userId,
            Username = username,
            Message = message,
            Timestamp = DateTime.UtcNow
        });
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        // Handle cleanup if needed
        await base.OnDisconnectedAsync(exception);
    }
}
