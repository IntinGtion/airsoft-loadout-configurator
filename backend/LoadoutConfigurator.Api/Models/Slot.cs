namespace LoadoutConfigurator.Api.Models;

public class Slot
{
    public int Id { get; set; }
    public int ComponentTemplateId { get; set; }
    public ComponentTemplate ComponentTemplate { get; set; } = null!;
    public int AttachmentTypeId { get; set; }
    public AttachmentType AttachmentType { get; set; } = null!;
    public required string Label { get; set; }
    public float PositionXPercent { get; set; }
    public float PositionYPercent { get; set; }

    // Discrete grid coordinates for footprint matching (e.g. MOLLE column/row).
    // Null for non-grid attachment points (e.g. a single QD-Sling point).
    public int? GridColumn { get; set; }
    public int? GridRow { get; set; }
}
