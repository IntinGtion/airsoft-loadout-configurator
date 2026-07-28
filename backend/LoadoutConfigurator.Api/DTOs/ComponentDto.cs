namespace LoadoutConfigurator.Api.DTOs;

public record ComponentRequest(
    int CategoryId,
    int ComponentTemplateId,
    string Name,
    string Manufacturer,
    decimal? WeightGrams,
    decimal? PriceEur
);

public record ComponentResponse(
    int Id,
    int CategoryId,
    string CategoryName,
    string Name,
    string Manufacturer,
    decimal? WeightGrams,
    decimal? PriceEur,
    string? SvgAssetPath,
    decimal? RealWidthMm,
    List<SlotResponse> Slots,
    List<AttachmentTypeResponse> AcceptedAttachmentTypes,
    List<MountPointResponse> MountPoints
);

public record SlotResponse(
    int Id,
    int AttachmentTypeId,
    string AttachmentTypeName,
    string Label,
    float PositionXPercent,
    float PositionYPercent,
    int? GridColumn,
    int? GridRow
);

public record MountPointResponse(
    int Id,
    int AttachmentTypeId,
    string AttachmentTypeName,
    string Label,
    float PositionXPercent,
    float PositionYPercent,
    int? GridColumn,
    int? GridRow
);

public record AttachmentTypeResponse(int Id, string Name);
