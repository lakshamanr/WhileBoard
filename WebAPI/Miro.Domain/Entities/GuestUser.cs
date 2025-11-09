using System;

namespace Miro.Domain.Entities
{
    public class GuestUser
    {
        public Guid Id { get; set; }
        public string? Nickname { get; set; }
        public Guid BoardId { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime ExpiresAt { get; set; }
    }
}
