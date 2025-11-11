namespace CollaborativeWhiteboard.Domain.Entities;

public class BoardElement
{
    public Guid Id { get; set; }
    public Guid BoardId { get; set; }
    public ElementType Type { get; set; }

    // Position and size
    public double X { get; set; }
    public double Y { get; set; }
    public double Width { get; set; }
    public double Height { get; set; }
    public double Rotation { get; set; } = 0;
    public int ZIndex { get; set; } = 0;

    // Styling
    public string BackgroundColor { get; set; } = "#FFFFFF";
    public string BorderColor { get; set; } = "#000000";
    public double BorderWidth { get; set; } = 1;
    public string TextColor { get; set; } = "#000000";
    public string FontFamily { get; set; } = "Arial";
    public double FontSize { get; set; } = 14;
    public string FontWeight { get; set; } = "normal";
    public string FontStyle { get; set; } = "normal";

    // Content
    public string TextContent { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;

    // For connectors
    public Guid? ConnectedFromElementId { get; set; }
    public Guid? ConnectedToElementId { get; set; }
    public string ConnectorStyle { get; set; } = "straight"; // straight, curved, elbow

    // For drawing paths
    public string PathData { get; set; } = string.Empty; // SVG path data

    // Metadata
    public Guid CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public bool IsLocked { get; set; } = false;

    // Navigation properties
    public Board Board { get; set; } = null!;
    public User Creator { get; set; } = null!;
}

public enum ElementType
{
    Rectangle,
    Circle,
    Triangle,
    Line,
    Connector,
    Text,
    StickyNote,
    Drawing,
    Image
}
