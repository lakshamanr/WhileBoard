using CollaborativeWhiteboard.Application.DTOs;
using CollaborativeWhiteboard.Application.Interfaces;
using CollaborativeWhiteboard.Domain.Entities;
using CollaborativeWhiteboard.Domain.Interfaces;

namespace CollaborativeWhiteboard.Application.Services;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly ITokenService _tokenService;

    public AuthService(IUserRepository userRepository, ITokenService tokenService)
    {
        _userRepository = userRepository;
        _tokenService = tokenService;
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterDto registerDto)
    {
        // Check if email already exists
        if (await _userRepository.EmailExistsAsync(registerDto.Email))
            throw new Exception("Email already exists");

        // Check if username already exists
        if (await _userRepository.UsernameExistsAsync(registerDto.Username))
            throw new Exception("Username already exists");

        // Create user
        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = registerDto.Username,
            Email = registerDto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(registerDto.Password),
            FirstName = registerDto.FirstName,
            LastName = registerDto.LastName,
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };

        await _userRepository.AddAsync(user);

        // Generate token
        var token = _tokenService.GenerateToken(user);

        return new AuthResponseDto
        {
            Token = token,
            User = MapToUserDto(user)
        };
    }

    public async Task<AuthResponseDto> LoginAsync(LoginDto loginDto)
    {
        var user = await _userRepository.GetByEmailAsync(loginDto.Email);

        if (user == null || !BCrypt.Net.BCrypt.Verify(loginDto.Password, user.PasswordHash))
            throw new Exception("Invalid email or password");

        if (!user.IsActive)
            throw new Exception("User account is inactive");

        // Update last login
        user.LastLoginAt = DateTime.UtcNow;
        await _userRepository.UpdateAsync(user);

        // Generate token
        var token = _tokenService.GenerateToken(user);

        return new AuthResponseDto
        {
            Token = token,
            User = MapToUserDto(user)
        };
    }

    public async Task<UserDto?> GetUserByIdAsync(Guid userId)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        return user != null ? MapToUserDto(user) : null;
    }

    public async Task<UserDto> UpdateUserAsync(Guid userId, UpdateUserDto updateDto)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
            throw new Exception("User not found");

        if (!string.IsNullOrEmpty(updateDto.FirstName))
            user.FirstName = updateDto.FirstName;

        if (!string.IsNullOrEmpty(updateDto.LastName))
            user.LastName = updateDto.LastName;

        if (!string.IsNullOrEmpty(updateDto.Username))
        {
            if (await _userRepository.UsernameExistsAsync(updateDto.Username))
                throw new Exception("Username already exists");
            user.Username = updateDto.Username;
        }

        await _userRepository.UpdateAsync(user);
        return MapToUserDto(user);
    }

    private static UserDto MapToUserDto(User user)
    {
        return new UserDto
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            CreatedAt = user.CreatedAt,
            LastLoginAt = user.LastLoginAt
        };
    }
}
