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

        public async Task CreateElement(object element, string boardId)
        {
            await Clients.Group(boardId).SendAsync("ReceiveNewElement", element);
        }

        public async Task UpdateElement(object element, string boardId)
        {
            await Clients.Group(boardId).SendAsync("ReceiveUpdatedElement", element);
        }

        public async Task DeleteElement(string elementId, string boardId)
        {
            await Clients.Group(boardId).SendAsync("ReceiveDeletedElement", elementId);
        }

        public async Task Undo(string boardId)
        {
            await Clients.Group(boardId).SendAsync("ReceiveUndo");
        }

        public async Task Redo(string boardId)
        {
            await Clients.Group(boardId).SendAsync("ReceiveRedo");
        }
    }
}
