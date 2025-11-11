FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy solution and project files
COPY CollaborativeWhiteboard.sln ./
COPY CollaborativeWhiteboard.API/CollaborativeWhiteboard.API.csproj CollaborativeWhiteboard.API/
COPY CollaborativeWhiteboard.Domain/CollaborativeWhiteboard.Domain.csproj CollaborativeWhiteboard.Domain/
COPY CollaborativeWhiteboard.Application/CollaborativeWhiteboard.Application.csproj CollaborativeWhiteboard.Application/
COPY CollaborativeWhiteboard.Infrastructure/CollaborativeWhiteboard.Infrastructure.csproj CollaborativeWhiteboard.Infrastructure/
COPY CollaborativeWhiteboard.Tests/CollaborativeWhiteboard.Tests.csproj CollaborativeWhiteboard.Tests/

# Restore dependencies
RUN dotnet restore

# Copy everything else
COPY . .

# Build and publish
WORKDIR /src/CollaborativeWhiteboard.API
RUN dotnet publish -c Release -o /app/publish

# Runtime image
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/publish .

EXPOSE 5000
ENV ASPNETCORE_URLS=http://+:5000

ENTRYPOINT ["dotnet", "CollaborativeWhiteboard.API.dll"]
