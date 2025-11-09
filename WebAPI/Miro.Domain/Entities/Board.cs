namespace Miro.Domain.Entities
{
    public class Board
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public ICollection<BoardElement> Elements { get; set; }
    }
}
