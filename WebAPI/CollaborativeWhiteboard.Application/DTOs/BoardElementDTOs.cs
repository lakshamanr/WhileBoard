namespace CollaborativeWhiteboard.Application.DTOs;

public class BoardElementDto
{
    public Guid Id { get; set; }
    public Guid BoardId { get; set; }
    public string Type { get; set; } = string.Empty;

    // Position and size
    public double X { get; set; }
    public double Y { get; set; }
    public double Width { get; set; }
    public double Height { get; set; }
    public double Rotation { get; set; }
    public int ZIndex { get; set; }

    // Styling
    public string BackgroundColor { get; set; } = "#FFFFFF";
    public string BorderColor { get; set; } = "#000000";
    public double BorderWidth { get; set; }
    public string TextColor { get; set; } = "#000000";
    public string FontFamily { get; set; } = "Arial";
    public double FontSize { get; set; }
    public string FontWeight { get; set; } = "normal";
    public string FontStyle { get; set; } = "normal";

    // Content
    public string TextContent { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;

    // For connectors
    public Guid? ConnectedFromElementId { get; set; }
    public Guid? ConnectedToElementId { get; set; }
    public string ConnectorStyle { get; set; } = "straight";

    // For drawing paths
    public string PathData { get; set; } = string.Empty;

    // Metadata
    public Guid CreatedBy { get; set; }
    public string CreatorName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public bool IsLocked { get; set; }
}

public class CreateBoardElementDto
{
    public string Type { get; set; } = string.Empty;
    public double X { get; set; }
    public double Y { get; set; }
    public double Width { get; set; }
    public double Height { get; set; }
    public double Rotation { get; set; } = 0;
    public string BackgroundColor { get; set; } = "#FFFFFF";
    public string BorderColor { get; set; } = "#000000";
    public double BorderWidth { get; set; } = 1;
    public string TextColor { get; set; } = "#000000";
    public string FontFamily { get; set; } = "Arial";
    public double FontSize { get; set; } = 14;
    public string FontWeight { get; set; } = "normal";
    public string FontStyle { get; set; } = "normal";
    public string TextContent { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public Guid? ConnectedFromElementId { get; set; }
    public Guid? ConnectedToElementId { get; set; }
    public string ConnectorStyle { get; set; } = "straight";
    public string PathData { get; set; } = string.Empty;
}

public class UpdateBoardElementDto
{
    public double? X { get; set; }
    public double? Y { get; set; }
    public double? Width { get; set; }
    public double? Height { get; set; }
    public double? Rotation { get; set; }
    public int? ZIndex { get; set; }
    public string? BackgroundColor { get; set; }
    public string? BorderColor { get; set; }
    public double? BorderWidth { get; set; }
    public string? TextColor { get; set; }
    public string? FontFamily { get; set; }
    public double? FontSize { get; set; }
    public string? FontWeight { get; set; }
    public string? FontStyle { get; set; }
    public string? TextContent { get; set; }
    public string? ImageUrl { get; set; }
    public Guid? ConnectedFromElementId { get; set; }
    public Guid? ConnectedToElementId { get; set; }
    public string? ConnectorStyle { get; set; }
    public string? PathData { get; set; }
    public bool? IsLocked { get; set; }
}

public class BatchUpdateElementsDto
{
    public List<UpdateElementPositionDto> Elements { get; set; } = new();
}

public class UpdateElementPositionDto
{
    public Guid Id { get; set; }
    public double X { get; set; }
    public double Y { get; set; }
}
