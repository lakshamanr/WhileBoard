namespace CollaborativeWhiteboard.Domain.Entities;

public class BoardCollaborator
{
    public Guid Id { get; set; }
    public Guid BoardId { get; set; }
    public Guid UserId { get; set; }
    public PermissionLevel Permission { get; set; }
    public DateTime AddedAt { get; set; }
    public Guid AddedBy { get; set; }

    // Navigation properties
    public Board Board { get; set; } = null!;
    public User User { get; set; } = null!;
}

public enum PermissionLevel
{
    Viewer,   // Can only view
    Editor,   // Can edit and add elements
    Admin     // Can edit, delete, and manage collaborators
}
