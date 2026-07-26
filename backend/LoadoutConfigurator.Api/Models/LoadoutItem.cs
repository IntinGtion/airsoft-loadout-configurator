namespace LoadoutConfigurator.Api.Models;

public class LoadoutItem
{
    public int Id { get; set; }
    public int LoadoutId { get; set; }
    public Loadout Loadout { get; set; } = null!;
    public int ComponentId { get; set; }
    public Component Component { get; set; } = null!;
    public int? ParentSlotId { get; set; }
}
