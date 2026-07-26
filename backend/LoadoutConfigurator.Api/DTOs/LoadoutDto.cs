namespace LoadoutConfigurator.Api.DTOs;

public record LoadoutRequest(string Name);

public record LoadoutSummary(
    int Id,
    string Name,
    Guid ShareToken,
    DateTime CreatedAt,
    int ItemCount
);

public record LoadoutResponse(
    int Id,
    string Name,
    Guid ShareToken,
    DateTime CreatedAt,
    List<LoadoutItemResponse> Items
);

public record LoadoutItemRequest(int ComponentId, int? ParentSlotId);

public record LoadoutItemResponse(
    int Id,
    int ComponentId,
    string ComponentName,
    string CategoryName,
    decimal? WeightGrams,
    decimal? PriceEur,
    string? SvgAssetPath,
    List<AttachmentTypeResponse> AcceptedAttachmentTypes,
    int? ParentSlotId
);
