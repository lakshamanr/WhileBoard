# Collaborative Whiteboard - Miro Clone

A complete, full-stack collaborative whiteboard application built with Angular and C# .NET Core, featuring real-time collaboration, infinite canvas, and comprehensive drawing tools.

## Features

### Core Features
- **Infinite Canvas** - Unlimited workspace with pan and zoom capabilities
- **Real-time Collaboration** - Multi-user editing with SignalR WebSockets
- **Shape Tools** - Rectangle, Circle, Triangle, Line drawing
- **Text & Sticky Notes** - Add text and sticky notes to the canvas
- **Drawing Tool** - Freehand pen/drawing tool
- **Connectors** - Connect elements with various connector styles
- **Drag & Drop** - Move elements freely on the canvas
- **Zoom & Pan** - Scale and navigate the canvas
- **Undo/Redo** - Full history management (up to 50 steps)
- **Keyboard Shortcuts** - Efficient workflow with hotkeys
- **Autosave** - Automatic saving every 2 seconds
- **User Authentication** - Secure JWT-based authentication
- **Board Management** - Create, edit, delete, and share boards
- **Collaborator Permissions** - Viewer, Editor, and Admin roles

### Technical Highlights
- **Clean Architecture** - Domain, Application, Infrastructure layers
- **Entity Framework Core** - Code-first with migrations
- **SignalR** - Real-time WebSocket communication
- **JWT Authentication** - Secure token-based auth
- **MS SQL Database** - Robust data persistence
- **Docker Compose** - Easy deployment and setup
- **Modular Angular** - Feature-based module structure
- **TypeScript** - Type-safe frontend development

## Architecture

### Backend (.NET 8)
```
WebAPI/
├── CollaborativeWhiteboard.API/          # Web API Controllers, SignalR Hubs
├── CollaborativeWhiteboard.Application/  # Business Logic, DTOs, Services
├── CollaborativeWhiteboard.Domain/       # Entities, Interfaces
├── CollaborativeWhiteboard.Infrastructure/ # EF Core, Repositories
└── CollaborativeWhiteboard.Tests/        # Unit & Integration Tests
```

### Frontend (Angular 17)
```
AngularProject/src/app/
├── core/                   # Core services, guards, interceptors
│   ├── guards/            # Auth guard
│   ├── interceptors/      # HTTP interceptors
│   ├── models/            # TypeScript interfaces
│   └── services/          # API services
├── features/              # Feature modules
│   ├── auth/             # Authentication
│   ├── boards/           # Board management
│   └── whiteboard/       # Canvas & drawing
└── shared/               # Shared components
```

## Prerequisites

- Docker Desktop
- Docker Compose
- (Optional) Node.js 20+ for local Angular development
- (Optional) .NET 8 SDK for local backend development

## Quick Start with Docker

### 1. Clone the Repository
```bash
git clone <repository-url>
cd docker-compose
```

### 2. Start All Services
```bash
docker-compose up --build
```

This will start:
- **Frontend**: http://localhost:4200
- **Backend API**: http://localhost:5000
- **SQL Server**: localhost:1433
- **Swagger UI**: http://localhost:5000/swagger

### 3. Access the Application
1. Open your browser to http://localhost:4200
2. Register a new account
3. Create your first whiteboard
4. Start drawing!

## Local Development Setup

### Backend Setup

#### 1. Install .NET 8 SDK
Download from: https://dotnet.microsoft.com/download/dotnet/8.0

#### 2. Restore Dependencies
```bash
cd WebAPI
dotnet restore
```

#### 3. Update Database Connection (Optional)
Edit `CollaborativeWhiteboard.API/appsettings.json`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost,1433;Database=CollaborativeWhiteboardDB;User Id=sa;Password=YourPassword;TrustServerCertificate=True"
  }
}
```

#### 4. Run Migrations
```bash
cd CollaborativeWhiteboard.API
dotnet ef database update
```

#### 5. Run the API
```bash
dotnet run
```

API will be available at http://localhost:5000

### Frontend Setup

#### 1. Install Node.js
Download from: https://nodejs.org (v20 or higher)

#### 2. Install Dependencies
```bash
cd AngularProject
npm install
```

#### 3. Update API URL (Optional)
Edit `src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000/api'
};
```

#### 4. Run Development Server
```bash
npm start
```

Frontend will be available at http://localhost:4200

## Database Schema

### Users Table
- User authentication and profile information
- Relationships: Owns boards, collaborates on boards

### Boards Table
- Whiteboard metadata (name, description, owner)
- Tracks creation/update timestamps
- Public/private visibility

### BoardElements Table
- Canvas elements (shapes, text, drawings)
- Position, size, rotation, z-index
- Styling properties (colors, fonts, borders)
- Connected elements (for connectors)

### BoardCollaborators Table
- User permissions per board
- Permission levels: Viewer, Editor, Admin

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/me` - Get current user info
- `PUT /api/auth/me` - Update user profile

### Boards
- `GET /api/boards` - Get user's boards
- `GET /api/boards/shared` - Get shared boards
- `GET /api/boards/{id}` - Get board details
- `POST /api/boards` - Create new board
- `PUT /api/boards/{id}` - Update board
- `DELETE /api/boards/{id}` - Delete board
- `GET /api/boards/{id}/collaborators` - Get collaborators
- `POST /api/boards/{id}/collaborators` - Add collaborator
- `DELETE /api/boards/{id}/collaborators/{userId}` - Remove collaborator

### Elements
- `GET /api/boards/{boardId}/elements` - Get all elements
- `POST /api/boards/{boardId}/elements` - Create element
- `PUT /api/boards/{boardId}/elements/{id}` - Update element
- `DELETE /api/boards/{boardId}/elements/{id}` - Delete element
- `POST /api/boards/{boardId}/elements/batch-update` - Batch update
- `POST /api/boards/{boardId}/elements/{id}/bring-to-front` - Z-index
- `POST /api/boards/{boardId}/elements/{id}/send-to-back` - Z-index

### Real-time (SignalR)
- `JoinBoard` - Join board room
- `LeaveBoard` - Leave board room
- `ElementCreated` - Broadcast new element
- `ElementUpdated` - Broadcast element update
- `ElementDeleted` - Broadcast element deletion
- `CursorMoved` - Broadcast cursor position

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `V` | Select tool |
| `R` | Rectangle tool |
| `C` | Circle tool |
| `L` | Line tool |
| `T` | Text tool |
| `S` | Sticky note tool |
| `P` | Pen/Drawing tool |
| `Ctrl+Z` | Undo |
| `Ctrl+Shift+Z` | Redo |
| `Ctrl+C` | Copy |
| `Ctrl+V` | Paste |
| `Ctrl+A` | Select all |
| `Delete` | Delete selected |
| `Ctrl++` | Zoom in |
| `Ctrl+-` | Zoom out |
| `Shift+Drag` | Pan canvas |
| `Double-Click` | Edit text element |

## How to Use Special Tools

### Text Tool
1. Click the **Text** button in the toolbar
2. Click anywhere on the canvas
3. Enter your text in the prompt dialog
4. Text will be created at the clicked position
5. To edit: Switch to **Select** tool and double-click the text element

### Connector Tool
1. Click the **Connector** button in the toolbar
2. Click the first element you want to connect (start point)
3. The element will be highlighted
4. Click the second element you want to connect (end point)
5. A connector line with arrow will be drawn between the elements
6. Connectors automatically update when you move connected elements
7. Supported connector styles:
   - **Straight** (default) - Direct line
   - **Curved** - Bezier curve
   - **Elbow** - Right-angle connector

### Drawing/Pen Tool
1. Click the **Pen** button
2. Click and drag on the canvas
3. Draw freehand paths
4. Release to complete the drawing

## Running Tests

### Backend Tests (xUnit)
```bash
cd WebAPI/CollaborativeWhiteboard.Tests
dotnet test
```

### Frontend Tests (Jasmine/Karma)
```bash
cd AngularProject
npm test
```

### E2E Tests (Cypress)
```bash
cd AngularProject
npm run e2e
```

## Docker Commands

### Build and Start
```bash
docker-compose up --build
```

### Start (without rebuild)
```bash
docker-compose up
```

### Stop All Services
```bash
docker-compose down
```

### View Logs
```bash
docker-compose logs -f
```

### Restart a Service
```bash
docker-compose restart webapi
```

### Database Access
```bash
docker exec -it docker-compose-database-1 /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P P@ssword123
```

## Troubleshooting

### Database Connection Issues
1. Ensure SQL Server container is running: `docker ps`
2. Check connection string in appsettings.json
3. Wait 30 seconds for SQL Server to fully start
4. Run migrations: `dotnet ef database update`

### SignalR Connection Issues
1. Check CORS settings in Program.cs
2. Verify API URL in Angular environment files
3. Check browser console for WebSocket errors
4. Ensure JWT token is valid

### Port Conflicts
If ports 4200, 5000, or 1433 are in use:
1. Stop conflicting services
2. Or modify ports in docker-compose.yml

### Build Errors
```bash
# Clean and rebuild backend
cd WebAPI
dotnet clean
dotnet build

# Clean and rebuild frontend
cd AngularProject
rm -rf node_modules
npm install
```

## Performance Optimization

### Backend
- EF Core query optimization with `.AsNoTracking()`
- Indexed database columns for fast queries
- SignalR connection pooling
- JWT token caching

### Frontend
- Lazy loading feature modules
- Canvas rendering optimization
- Debounced auto-save (2 seconds)
- Change detection strategy optimization

## Security

- JWT token authentication
- Password hashing with BCrypt
- SQL injection prevention (EF Core parameterized queries)
- XSS protection (Angular sanitization)
- CORS configuration
- HTTPS ready (update docker-compose for production)

## Load Testing

Test real-time collaboration with multiple users:

1. Open multiple browser windows
2. Login with different accounts
3. Share a board between users
4. Test concurrent editing
5. Monitor SignalR connection stability

For automated load testing, use tools like:
- Apache JMeter
- k6
- Artillery

## Production Deployment

### Environment Variables
Set these in production:
```bash
ASPNETCORE_ENVIRONMENT=Production
JWT_SECRET_KEY=<strong-random-key>
DB_CONNECTION_STRING=<production-db>
CORS_ORIGINS=<your-domain>
```

### HTTPS Configuration
1. Obtain SSL certificates
2. Update nginx.conf with SSL settings
3. Update docker-compose with port 443

### Database Backups
```bash
# Backup
docker exec docker-compose-database-1 /opt/mssql-tools/bin/sqlcmd \
  -S localhost -U sa -P P@ssword123 \
  -Q "BACKUP DATABASE CollaborativeWhiteboardDB TO DISK='/var/opt/mssql/backup/db.bak'"

# Restore
docker exec docker-compose-database-1 /opt/mssql-tools/bin/sqlcmd \
  -S localhost -U sa -P P@ssword123 \
  -Q "RESTORE DATABASE CollaborativeWhiteboardDB FROM DISK='/var/opt/mssql/backup/db.bak'"
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - feel free to use this project for learning or commercial purposes.

## Support

For issues, questions, or contributions:
- Create an issue in GitHub
- Check existing documentation
- Review API swagger docs at `/swagger`

## Future Enhancements

- [ ] Image upload and embedding
- [ ] Templates library
- [ ] Export to PDF/PNG
- [ ] Comments and annotations
- [ ] Video/audio chat integration
- [ ] Mobile responsive design
- [ ] Presentation mode
- [ ] Version history
- [ ] Team workspaces
- [ ] Advanced shapes library

## Acknowledgments

Built with:
- Angular 17
- .NET 8
- Entity Framework Core
- SignalR
- SQL Server
- Docker

Inspired by:
- Miro
- Figma
- Excalidraw

---

**Happy Collaborating!** 🎨✨
