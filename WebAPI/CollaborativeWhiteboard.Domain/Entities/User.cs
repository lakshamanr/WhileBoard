namespace CollaborativeWhiteboard.Domain.Entities;

public class User
{
    public Guid Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation properties
    public ICollection<Board> OwnedBoards { get; set; } = new List<Board>();
    public ICollection<BoardCollaborator> BoardCollaborations { get; set; } = new List<BoardCollaborator>();
}
