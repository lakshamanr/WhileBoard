FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

COPY *.sln .
COPY Miro.API/*.csproj ./Miro.API/
COPY Miro.Application/*.csproj ./Miro.Application/
COPY Miro.Domain/*.csproj ./Miro.Domain/
COPY Miro.Infrastructure/*.csproj ./Miro.Infrastructure/
RUN dotnet restore

COPY . .
RUN dotnet publish -c Release -o out

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/out .
ENTRYPOINT ["dotnet", "Miro.API.dll"]
