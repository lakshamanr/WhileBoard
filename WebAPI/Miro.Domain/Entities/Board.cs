using System;
using System.Collections.Generic;

namespace Miro.Domain.Entities
{
    public class Board
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public string OwnerId { get; set; }
        public User Owner { get; set; }
        public ICollection<BoardElement> Elements { get; set; }
    }
}
