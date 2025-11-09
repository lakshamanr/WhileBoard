using System;

namespace Miro.Domain.Entities
{
    public enum PermissionLevel
    {
        Viewer,
        Editor,
        Owner
    }

    public class BoardPermission
    {
        public Guid Id { get; set; }
        public Guid BoardId { get; set; }
        public Board? Board { get; set; }
        public Guid UserId { get; set; }
        public User? User { get; set; }
        public PermissionLevel PermissionLevel { get; set; }
    }
}
