using CollaborativeWhiteboard.Application.DTOs;

namespace CollaborativeWhiteboard.Application.Interfaces;

public interface IAuthService
{
    Task<AuthResponseDto> RegisterAsync(RegisterDto registerDto);
    Task<AuthResponseDto> LoginAsync(LoginDto loginDto);
    Task<UserDto?> GetUserByIdAsync(Guid userId);
    Task<UserDto> UpdateUserAsync(Guid userId, UpdateUserDto updateDto);
}
