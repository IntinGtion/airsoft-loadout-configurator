namespace LoadoutConfigurator.Api.DTOs;

public record SlotRequest(
    int ComponentTemplateId,
    int AttachmentTypeId,
    string Label,
    float PositionXPercent,
    float PositionYPercent,
    int? GridColumn,
    int? GridRow
);
