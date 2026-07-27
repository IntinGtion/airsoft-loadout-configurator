namespace LoadoutConfigurator.Api.Models;

public class Component
{
    public int Id { get; set; }
    public int CategoryId { get; set; }
    public Category Category { get; set; } = null!;
    public required string Name { get; set; }
    public required string Manufacturer { get; set; }
    public decimal? WeightGrams { get; set; }
    public decimal? PriceEur { get; set; }
    public string? SvgAssetPath { get; set; }
    public List<Slot> Slots { get; set; } = [];
    public List<AttachmentType> AcceptedAttachmentTypes { get; set; } = [];
    public List<MountPoint> MountPoints { get; set; } = [];
}
