namespace LoadoutConfigurator.Api.Models;

public class Slot
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
