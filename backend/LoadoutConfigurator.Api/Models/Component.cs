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

    // Real-world reference width in millimeters (approximate, from public product specs).
    // Used to size this component's SVG on the canvas relative to other components,
    // instead of every asset rendering at the same fixed pixel width regardless of
    // its actual physical size.
    public decimal? RealWidthMm { get; set; }
    public List<Slot> Slots { get; set; } = [];
    public List<AttachmentType> AcceptedAttachmentTypes { get; set; } = [];
    public List<MountPoint> MountPoints { get; set; } = [];
}
