using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace Miro.API.Hubs
{
    public class BoardHub : Hub
    {
        public async Task JoinBoard(string boardId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, boardId);
        }

        public async Task SendElement(object element, string boardId)
        {
            await Clients.Group(boardId).SendAsync("ReceiveElement", element);
        }
    }
}
