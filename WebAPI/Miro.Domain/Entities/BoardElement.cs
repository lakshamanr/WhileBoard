using System;

namespace Miro.Domain.Entities
{
    public abstract class BoardElement
    {
        public Guid Id { get; set; }
        public Guid BoardId { get; set; }
        public Board Board { get; set; }
        public string Type { get; set; }
        public int X { get; set; }
        public int Y { get; set; }
        public int Width { get; set; }
        public int Height { get; set; }
    }
}
