using CollaborativeWhiteboard.Domain.Entities;

namespace CollaborativeWhiteboard.Application.Interfaces;

public interface ITokenService
{
    string GenerateToken(User user);
    Guid? ValidateToken(string token);
}
