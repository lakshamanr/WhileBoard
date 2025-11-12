#!/bin/bash
echo "========================================="
echo "Starting Backend API with SQLite"
echo "========================================="
echo ""

export DATABASE_PATH="./whiteboard.db"
export ASPNETCORE_URLS="http://localhost:5000"
export ASPNETCORE_ENVIRONMENT="Development"

echo "Configuration:"
echo "  - Database: SQLite (./whiteboard.db)"
echo "  - API URL: http://localhost:5000"
echo "  - Swagger: http://localhost:5000/swagger"
echo ""
echo "Default credentials:"
echo "  - Username: admin"
echo "  - Password: Admin@123"
echo ""

cd WebAPI/CollaborativeWhiteboard.API
dotnet run
