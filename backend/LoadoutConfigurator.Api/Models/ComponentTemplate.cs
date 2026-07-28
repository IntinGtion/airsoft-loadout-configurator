namespace LoadoutConfigurator.Api.Models;

// The visual/physical shape shared by one or more real products (e.g. two manufacturers
// selling an identical clone of the same plate carrier). Holds everything that describes
// "what does it look like and where can things attach to it" — Component (the real,
// purchasable product) holds business data like price, weight, and manufacturer instead.
public class ComponentTemplate
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public string? SvgAssetPath { get; set; }

    // Real-world reference width in millimeters (approximate, from public product specs).
    // Used to size this template's SVG on the canvas relative to other components,
    // instead of every asset rendering at the same fixed pixel width regardless of
    // its actual physical size.
    public decimal? RealWidthMm { get; set; }
    public List<Slot> Slots { get; set; } = [];
    public List<MountPoint> MountPoints { get; set; } = [];
    public List<AttachmentType> AcceptedAttachmentTypes { get; set; } = [];
}
