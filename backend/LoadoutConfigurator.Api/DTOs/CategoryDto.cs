namespace LoadoutConfigurator.Api.DTOs;

public record CategoryRequest(string Name, string Icon);

public record CategoryResponse(int Id, string Name, string Icon);
