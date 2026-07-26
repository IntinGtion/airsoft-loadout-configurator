namespace LoadoutConfigurator.Api.Models;

public class Loadout
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public Guid ShareToken { get; set; } = Guid.NewGuid();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public List<LoadoutItem> Items { get; set; } = [];
}
