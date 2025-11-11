namespace CollaborativeWhiteboard.Application.DTOs;

public class BoardDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public Guid OwnerId { get; set; }
    public string OwnerName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public bool IsPublic { get; set; }
    public string ThumbnailUrl { get; set; } = string.Empty;
    public int ElementCount { get; set; }
    public int CollaboratorCount { get; set; }
}

public class CreateBoardDto
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsPublic { get; set; } = false;
}

public class UpdateBoardDto
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public bool? IsPublic { get; set; }
    public string? ThumbnailUrl { get; set; }
}

public class BoardDetailDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public Guid OwnerId { get; set; }
    public string OwnerName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public bool IsPublic { get; set; }
    public string ThumbnailUrl { get; set; } = string.Empty;
    public List<BoardElementDto> Elements { get; set; } = new();
    public List<CollaboratorDto> Collaborators { get; set; } = new();
}

public class CollaboratorDto
{
    public Guid UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Permission { get; set; } = string.Empty;
    public DateTime AddedAt { get; set; }
}

public class AddCollaboratorDto
{
    public string Email { get; set; } = string.Empty;
    public string Permission { get; set; } = "Viewer";
}

public class UpdateCollaboratorDto
{
    public string Permission { get; set; } = string.Empty;
}
