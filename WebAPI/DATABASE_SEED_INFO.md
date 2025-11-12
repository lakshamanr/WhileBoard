# Database Seeding Information

## Default Admin User

When the application starts for the first time and the database is empty, a default admin user will be automatically created with the following credentials:

### Credentials:
- **Username**: `admin`
- **Email**: `admin@whiteboard.com`
- **Password**: `Admin@123`

### Usage:

1. **Start the application** - The database will be created and migrations will be applied automatically
2. **The seeder will run** - If no users exist, the default admin user will be created
3. **Login** using the credentials above via the `/api/auth/login` endpoint

### Login Example:

**POST** `/api/auth/login`

```json
{
  "email": "admin@whiteboard.com",
  "password": "Admin@123"
}
```

### Security Note:
?? **Important**: For production environments, you should:
- Change the default admin password immediately after first login
- Consider removing or modifying the seeding logic
- Use strong, unique passwords
- Enable additional security measures (2FA, etc.)

### How Seeding Works:

The seeding is configured in `Program.cs` and runs after database migrations:
```csharp
var seeder = new DataSeeder(db, services.GetRequiredService<ILogger<DataSeeder>>());
await seeder.SeedAsync();
```

The `DataSeeder` class checks if any users exist in the database. If the Users table is empty, it creates the default admin user with a BCrypt-hashed password.

### Skipping Seed:

If you want to skip the automatic seeding, you can either:
1. Remove the seeding code from `Program.cs`
2. Comment out the `await seeder.SeedAsync();` line
3. The seeder automatically skips if users already exist
