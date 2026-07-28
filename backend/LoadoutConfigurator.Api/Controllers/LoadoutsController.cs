using LoadoutConfigurator.Api.Data;
using LoadoutConfigurator.Api.DTOs;
using LoadoutConfigurator.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LoadoutConfigurator.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LoadoutsController(LoadoutContext db) : ControllerBase
{
    // ── Loadout CRUD ────────────────────────────────────────────────────────

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var loadouts = await db.Loadouts
            .Select(l => new LoadoutSummary(
                l.Id,
                l.Name,
                l.ShareToken,
                l.CreatedAt,
                l.Items.Count))
            .ToListAsync();
        return Ok(loadouts);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var loadout = await LoadFull().FirstOrDefaultAsync(l => l.Id == id);
        if (loadout is null) return NotFound();
        return Ok(ToResponse(loadout));
    }

    [HttpGet("share/{token:guid}")]
    public async Task<IActionResult> GetByShareToken(Guid token)
    {
        var loadout = await LoadFull().FirstOrDefaultAsync(l => l.ShareToken == token);
        if (loadout is null) return NotFound();
        return Ok(ToResponse(loadout));
    }

    [HttpPost]
    public async Task<IActionResult> Create(LoadoutRequest request)
    {
        var loadout = new Loadout { Name = request.Name };
        db.Loadouts.Add(loadout);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = loadout.Id },
            new LoadoutSummary(loadout.Id, loadout.Name, loadout.ShareToken, loadout.CreatedAt, 0));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, LoadoutRequest request)
    {
        var loadout = await db.Loadouts.FindAsync(id);
        if (loadout is null) return NotFound();
        loadout.Name = request.Name;
        await db.SaveChangesAsync();
        return Ok(new LoadoutSummary(loadout.Id, loadout.Name, loadout.ShareToken, loadout.CreatedAt,
            await db.LoadoutItems.CountAsync(i => i.LoadoutId == id)));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var loadout = await db.Loadouts.FindAsync(id);
        if (loadout is null) return NotFound();
        db.Loadouts.Remove(loadout);
        await db.SaveChangesAsync();
        return NoContent();
    }

    // ── Loadout Items ────────────────────────────────────────────────────────

    [HttpPost("{id}/items")]
    public async Task<IActionResult> AddItem(int id, LoadoutItemRequest request)
    {
        if (!await db.Loadouts.AnyAsync(l => l.Id == id))
            return NotFound();

        var component = await db.Components
            .Include(c => c.ComponentTemplate).ThenInclude(t => t.AcceptedAttachmentTypes)
            .Include(c => c.ComponentTemplate).ThenInclude(t => t.MountPoints)
            .FirstOrDefaultAsync(c => c.Id == request.ComponentId);

        if (component is null)
            return BadRequest(new { error = "Component not found." });

        // Validate that the component fits the parent slot
        if (request.ParentSlotId.HasValue)
        {
            var parentSlot = await db.Slots
                .Include(s => s.AttachmentType)
                .FirstOrDefaultAsync(s => s.Id == request.ParentSlotId.Value);

            if (parentSlot is null)
                return BadRequest(new { error = "Parent slot not found." });

            var fits = component.ComponentTemplate.AcceptedAttachmentTypes
                .Any(a => a.Id == parentSlot.AttachmentTypeId);

            if (!fits)
                return UnprocessableEntity(new
                {
                    error = $"'{component.Name}' does not accept '{parentSlot.AttachmentType.Name}' attachments."
                });

            var footprintError = await ValidateFootprint(id, component, parentSlot);
            if (footprintError is not null)
                return UnprocessableEntity(new { error = footprintError });
        }

        var item = new LoadoutItem
        {
            LoadoutId = id,
            ComponentId = request.ComponentId,
            ParentSlotId = request.ParentSlotId
        };

        db.LoadoutItems.Add(item);
        await db.SaveChangesAsync();

        var created = await db.LoadoutItems
            .Include(i => i.Component).ThenInclude(c => c.Category)
            .Include(i => i.Component).ThenInclude(c => c.ComponentTemplate).ThenInclude(t => t.AcceptedAttachmentTypes)
            .FirstAsync(i => i.Id == item.Id);

        return CreatedAtAction(nameof(GetById), new { id }, ToItemResponse(created));
    }

    [HttpPut("{id}/items/{itemId}")]
    public async Task<IActionResult> MoveItem(int id, int itemId, LoadoutItemRequest request)
    {
        var item = await db.LoadoutItems
            .Include(i => i.Component).ThenInclude(c => c.Category)
            .Include(i => i.Component).ThenInclude(c => c.ComponentTemplate).ThenInclude(t => t.AcceptedAttachmentTypes)
            .Include(i => i.Component).ThenInclude(c => c.ComponentTemplate).ThenInclude(t => t.MountPoints)
            .FirstOrDefaultAsync(i => i.Id == itemId && i.LoadoutId == id);

        if (item is null) return NotFound();

        if (request.ParentSlotId.HasValue)
        {
            var parentSlot = await db.Slots
                .Include(s => s.AttachmentType)
                .FirstOrDefaultAsync(s => s.Id == request.ParentSlotId.Value);

            if (parentSlot is null)
                return BadRequest(new { error = "Parent slot not found." });

            var fits = item.Component.ComponentTemplate.AcceptedAttachmentTypes
                .Any(a => a.Id == parentSlot.AttachmentTypeId);

            if (!fits)
                return UnprocessableEntity(new
                {
                    error = $"'{item.Component.Name}' does not accept '{parentSlot.AttachmentType.Name}' attachments."
                });

            var footprintError = await ValidateFootprint(id, item.Component, parentSlot, excludeItemId: item.Id);
            if (footprintError is not null)
                return UnprocessableEntity(new { error = footprintError });
        }

        item.ParentSlotId = request.ParentSlotId;
        await db.SaveChangesAsync();

        return Ok(ToItemResponse(item));
    }

    [HttpDelete("{id}/items/{itemId}")]
    public async Task<IActionResult> RemoveItem(int id, int itemId)
    {
        var item = await db.LoadoutItems
            .FirstOrDefaultAsync(i => i.Id == itemId && i.LoadoutId == id);

        if (item is null) return NotFound();
        db.LoadoutItems.Remove(item);
        await db.SaveChangesAsync();
        return NoContent();
    }

    // ── Footprint matching ──────────────────────────────────────────────────
    //
    // A component with MountPoints (e.g. a pouch with a 2×4 grid of MOLLE straps)
    // doesn't just need ONE compatible slot — it needs a whole matching pattern of
    // free slots on the parent, in the same relative grid layout. We match this via
    // discrete Slot/MountPoint.GridColumn/GridRow rather than the display PositionX/
    // YPercent, since those percentages are relative to each asset's own SVG canvas
    // and aren't directly comparable across different components (see DEVELOPMENT.md
    // section 7 "gemeinsamer Maßstab" for the still-open visual-scale problem this
    // sidesteps). Components without grid data fall back to the original single-slot
    // behavior.

    /// Returns the parent Slots this component would occupy if anchored at `anchorSlot`,
    /// or null if its MountPoint footprint doesn't line up with the parent's Slot grid.
    private static List<Slot>? ComputeFootprint(Component component, Slot anchorSlot, List<Slot> parentSlots)
    {
        var gridMountPoints = component.ComponentTemplate.MountPoints
            .Where(m => m.GridColumn.HasValue && m.GridRow.HasValue)
            .ToList();

        if (gridMountPoints.Count == 0 || anchorSlot.GridColumn is null || anchorSlot.GridRow is null)
            return [anchorSlot];

        var anchorMountPoint = gridMountPoints
            .OrderBy(m => m.GridRow).ThenBy(m => m.GridColumn)
            .First();

        var footprint = new List<Slot>();
        foreach (var mountPoint in gridMountPoints)
        {
            var targetColumn = anchorSlot.GridColumn.Value + (mountPoint.GridColumn!.Value - anchorMountPoint.GridColumn!.Value);
            var targetRow = anchorSlot.GridRow.Value + (mountPoint.GridRow!.Value - anchorMountPoint.GridRow!.Value);

            var match = parentSlots.FirstOrDefault(s =>
                s.GridColumn == targetColumn && s.GridRow == targetRow && s.AttachmentTypeId == mountPoint.AttachmentTypeId);

            if (match is null) return null;
            footprint.Add(match);
        }

        return footprint;
    }

    /// Slot IDs (among `parentSlots`) already occupied by sibling items attached to this parent,
    /// optionally excluding one item (used when moving an item — it shouldn't block itself).
    private async Task<HashSet<int>> ComputeOccupiedSlotIds(int loadoutId, List<Slot> parentSlots, int? excludeItemId)
    {
        var parentSlotIds = parentSlots.Select(s => s.Id).ToHashSet();

        var siblings = await db.LoadoutItems
            .Where(i => i.LoadoutId == loadoutId
                && i.Id != excludeItemId
                && i.ParentSlotId.HasValue
                && parentSlotIds.Contains(i.ParentSlotId.Value))
            .Include(i => i.Component).ThenInclude(c => c.ComponentTemplate).ThenInclude(t => t.MountPoints)
            .ToListAsync();

        var occupied = new HashSet<int>();
        foreach (var sibling in siblings)
        {
            var siblingAnchor = parentSlots.First(s => s.Id == sibling.ParentSlotId!.Value);
            var footprint = ComputeFootprint(sibling.Component, siblingAnchor, parentSlots);
            if (footprint is null) continue; // pre-existing data shouldn't be invalid, but don't crash if it is
            foreach (var slot in footprint) occupied.Add(slot.Id);
        }

        return occupied;
    }

    /// Runs the full footprint check for placing `component` at `parentSlot`.
    /// Returns an error message if it doesn't fit or overlaps another item, null if it's valid.
    private async Task<string?> ValidateFootprint(int loadoutId, Component component, Slot parentSlot, int? excludeItemId = null)
    {
        var parentSlots = await db.Slots
            .Where(s => s.ComponentTemplateId == parentSlot.ComponentTemplateId)
            .ToListAsync();

        var footprint = ComputeFootprint(component, parentSlot, parentSlots);
        if (footprint is null)
            return $"'{component.Name}' does not fit here — its attachment pattern doesn't line up with the available slots at this position.";

        var occupied = await ComputeOccupiedSlotIds(loadoutId, parentSlots, excludeItemId);
        if (footprint.Any(s => occupied.Contains(s.Id)))
        {
            var slotWord = footprint.Count == 1 ? "slot" : "slots";
            return $"'{component.Name}' needs {footprint.Count} free {slotWord} here, but at least one is already occupied.";
        }

        return null;
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    private IQueryable<Loadout> LoadFull() =>
        db.Loadouts
            .Include(l => l.Items)
                .ThenInclude(i => i.Component)
                    .ThenInclude(c => c.Category)
            .Include(l => l.Items)
                .ThenInclude(i => i.Component)
                    .ThenInclude(c => c.ComponentTemplate)
                        .ThenInclude(t => t.AcceptedAttachmentTypes);

    private static LoadoutResponse ToResponse(Loadout l) => new(
        l.Id,
        l.Name,
        l.ShareToken,
        l.CreatedAt,
        l.Items.Select(ToItemResponse).ToList()
    );

    private static LoadoutItemResponse ToItemResponse(LoadoutItem i) => new(
        i.Id,
        i.ComponentId,
        i.Component.Name,
        i.Component.Category.Name,
        i.Component.WeightGrams,
        i.Component.PriceEur,
        i.Component.ComponentTemplate.SvgAssetPath,
        i.Component.ComponentTemplate.AcceptedAttachmentTypes
            .Select(a => new AttachmentTypeResponse(a.Id, a.Name)).ToList(),
        i.ParentSlotId
    );
}
