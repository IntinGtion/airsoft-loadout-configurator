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
            .Include(c => c.AcceptedAttachmentTypes)
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

            var fits = component.AcceptedAttachmentTypes
                .Any(a => a.Id == parentSlot.AttachmentTypeId);

            if (!fits)
                return UnprocessableEntity(new
                {
                    error = $"'{component.Name}' does not accept '{parentSlot.AttachmentType.Name}' attachments."
                });
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
            .Include(i => i.Component).ThenInclude(c => c.AcceptedAttachmentTypes)
            .FirstAsync(i => i.Id == item.Id);

        return CreatedAtAction(nameof(GetById), new { id }, ToItemResponse(created));
    }

    [HttpPut("{id}/items/{itemId}")]
    public async Task<IActionResult> MoveItem(int id, int itemId, LoadoutItemRequest request)
    {
        var item = await db.LoadoutItems
            .Include(i => i.Component).ThenInclude(c => c.AcceptedAttachmentTypes)
            .FirstOrDefaultAsync(i => i.Id == itemId && i.LoadoutId == id);

        if (item is null) return NotFound();

        if (request.ParentSlotId.HasValue)
        {
            var parentSlot = await db.Slots
                .Include(s => s.AttachmentType)
                .FirstOrDefaultAsync(s => s.Id == request.ParentSlotId.Value);

            if (parentSlot is null)
                return BadRequest(new { error = "Parent slot not found." });

            var fits = item.Component.AcceptedAttachmentTypes
                .Any(a => a.Id == parentSlot.AttachmentTypeId);

            if (!fits)
                return UnprocessableEntity(new
                {
                    error = $"'{item.Component.Name}' does not accept '{parentSlot.AttachmentType.Name}' attachments."
                });
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

    // ── Helpers ─────────────────────────────────────────────────────────────

    private IQueryable<Loadout> LoadFull() =>
        db.Loadouts
            .Include(l => l.Items)
                .ThenInclude(i => i.Component)
                    .ThenInclude(c => c.Category)
            .Include(l => l.Items)
                .ThenInclude(i => i.Component)
                    .ThenInclude(c => c.AcceptedAttachmentTypes);

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
        i.Component.SvgAssetPath,
        i.Component.AcceptedAttachmentTypes
            .Select(a => new AttachmentTypeResponse(a.Id, a.Name)).ToList(),
        i.ParentSlotId
    );
}
