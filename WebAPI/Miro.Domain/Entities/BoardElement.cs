using System;

namespace Miro.Domain.Entities
{
    public abstract class BoardElement
    {
        public Guid Id { get; set; }
        public Guid BoardId { get; set; }
        public Board? Board { get; set; }
        public int PositionX { get; set; }
        public int PositionY { get; set; }
        public int Width { get; set; }
        public int Height { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
