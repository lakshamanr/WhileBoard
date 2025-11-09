namespace Miro.Domain.Entities
{
    public class BoardElement
    {
        public Guid Id { get; set; }
        public Guid BoardId { get; set; }
        public string Type { get; set; }
        public double X { get; set; }
        public double Y { get; set; }
        public double Width { get; set; }
        public double Height { get; set; }
        public string Content { get; set; }
        public Board Board { get; set; }
    }
}
