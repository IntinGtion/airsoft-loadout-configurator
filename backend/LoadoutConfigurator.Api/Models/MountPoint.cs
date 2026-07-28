namespace LoadoutConfigurator.Api.Models;

// A point on this Component's own silhouette where it attaches to a parent Slot
// (the reverse direction of Slot, which is a point this Component offers to children).
public class MountPoint
{
    public int Id { get; set; }
    public int ComponentTemplateId { get; set; }
    public ComponentTemplate ComponentTemplate { get; set; } = null!;
    public int AttachmentTypeId { get; set; }
    public AttachmentType AttachmentType { get; set; } = null!;
    public required string Label { get; set; }
    public float PositionXPercent { get; set; }
    public float PositionYPercent { get; set; }

    // Discrete grid coordinates for footprint matching (e.g. MOLLE column/row),
    // relative to this component's own silhouette. Null for non-grid mount points.
    public int? GridColumn { get; set; }
    public int? GridRow { get; set; }
}
