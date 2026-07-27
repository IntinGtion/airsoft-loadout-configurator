namespace LoadoutConfigurator.Api.Models;

// A point on this Component's own silhouette where it attaches to a parent Slot
// (the reverse direction of Slot, which is a point this Component offers to children).
public class MountPoint
{
    public int Id { get; set; }
    public int ComponentId { get; set; }
    public Component Component { get; set; } = null!;
    public int AttachmentTypeId { get; set; }
    public AttachmentType AttachmentType { get; set; } = null!;
    public required string Label { get; set; }
    public float PositionXPercent { get; set; }
    public float PositionYPercent { get; set; }
}
