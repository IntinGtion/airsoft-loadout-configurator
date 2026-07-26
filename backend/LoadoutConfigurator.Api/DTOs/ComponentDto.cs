namespace LoadoutConfigurator.Api.DTOs;

public record ComponentRequest(
    int CategoryId,
    string Name,
    string Manufacturer,
    decimal? WeightGrams,
    decimal? PriceEur,
    string? SvgAssetPath,
    List<int> AcceptedAttachmentTypeIds
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
    List<SlotResponse> Slots,
    List<AttachmentTypeResponse> AcceptedAttachmentTypes
);

public record SlotResponse(
    int Id,
    int AttachmentTypeId,
    string AttachmentTypeName,
    string Label,
    float PositionXPercent,
    float PositionYPercent
);

public record AttachmentTypeResponse(int Id, string Name);
