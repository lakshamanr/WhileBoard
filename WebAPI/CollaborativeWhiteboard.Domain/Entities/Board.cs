namespace CollaborativeWhiteboard.Domain.Entities;

public class Board
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public Guid OwnerId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public bool IsPublic { get; set; } = false;
    public string ThumbnailUrl { get; set; } = string.Empty;

    // Navigation properties
    public User Owner { get; set; } = null!;
    public ICollection<BoardElement> Elements { get; set; } = new List<BoardElement>();
    public ICollection<BoardCollaborator> Collaborators { get; set; } = new List<BoardCollaborator>();
}
