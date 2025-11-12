using CollaborativeWhiteboard.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CollaborativeWhiteboard.Infrastructure.Data;

public class DataSeeder
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<DataSeeder> _logger;

    public DataSeeder(ApplicationDbContext context, ILogger<DataSeeder> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task SeedAsync()
    {
        try
        {
            // Check if any users exist
            if (await _context.Users.AnyAsync())
            {
                _logger.LogInformation("Database already contains users. Skipping seed.");
                return;
            }

            _logger.LogInformation("Seeding default admin user...");

            // Create default admin user
            // Password: Admin@123
            var adminUser = new User
            {
                Id = Guid.NewGuid(),
                Username = "admin",
                Email = "admin@whiteboard.com",
                PasswordHash = GetPasswordHash("Admin@123"),
                FirstName = "Admin",
                LastName = "User",
                CreatedAt = DateTime.UtcNow,
                IsActive = true
            };

            _context.Users.Add(adminUser);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Default admin user created successfully.");
            _logger.LogInformation("Username: admin");
            _logger.LogInformation("Email: admin@whiteboard.com");
            _logger.LogInformation("Password: Admin@123");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An error occurred while seeding the database.");
            throw;
        }
    }

    private static string GetPasswordHash(string password)
    {
        return BCrypt.Net.BCrypt.HashPassword(password);
    }
}
