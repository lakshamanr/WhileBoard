namespace Miro.Domain.Entities
{
    public class Text : BoardElement
    {
        public string? Content { get; set; }
        public string? Color { get; set; }
        public int FontSize { get; set; }
    }
}
