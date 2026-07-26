using LoadoutConfigurator.Api.Data;
using LoadoutConfigurator.Api.DTOs;
using LoadoutConfigurator.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LoadoutConfigurator.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SlotsController(LoadoutContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? componentId)
    {
        var query = db.Slots
            .Include(s => s.AttachmentType)
            .AsQueryable();

        if (componentId.HasValue)
            query = query.Where(s => s.ComponentId == componentId.Value);

        var slots = (await query.ToListAsync()).Select(ToResponse).ToList();
        return Ok(slots);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var slot = await db.Slots
            .Include(s => s.AttachmentType)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (slot is null) return NotFound();
        return Ok(ToResponse(slot));
    }

    [HttpPost]
    public async Task<IActionResult> Create(SlotRequest request)
    {
        if (!await db.Components.AnyAsync(c => c.Id == request.ComponentId))
            return BadRequest(new { error = "Component not found." });

        if (!await db.AttachmentTypes.AnyAsync(a => a.Id == request.AttachmentTypeId))
            return BadRequest(new { error = "AttachmentType not found." });

        var slot = new Slot
        {
            ComponentId = request.ComponentId,
            AttachmentTypeId = request.AttachmentTypeId,
            Label = request.Label,
            PositionXPercent = request.PositionXPercent,
            PositionYPercent = request.PositionYPercent
        };

        db.Slots.Add(slot);
        await db.SaveChangesAsync();

        var created = await db.Slots
            .Include(s => s.AttachmentType)
            .FirstAsync(s => s.Id == slot.Id);

        return CreatedAtAction(nameof(GetById), new { id = slot.Id }, ToResponse(created));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, SlotRequest request)
    {
        var slot = await db.Slots.FindAsync(id);
        if (slot is null) return NotFound();

        if (!await db.AttachmentTypes.AnyAsync(a => a.Id == request.AttachmentTypeId))
            return BadRequest(new { error = "AttachmentType not found." });

        slot.ComponentId = request.ComponentId;
        slot.AttachmentTypeId = request.AttachmentTypeId;
        slot.Label = request.Label;
        slot.PositionXPercent = request.PositionXPercent;
        slot.PositionYPercent = request.PositionYPercent;

        await db.SaveChangesAsync();

        var updated = await db.Slots
            .Include(s => s.AttachmentType)
            .FirstAsync(s => s.Id == slot.Id);

        return Ok(ToResponse(updated));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var slot = await db.Slots.FindAsync(id);
        if (slot is null) return NotFound();
        db.Slots.Remove(slot);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private static SlotResponse ToResponse(Slot s) => new(
        s.Id,
        s.AttachmentTypeId,
        s.AttachmentType.Name,
        s.Label,
        s.PositionXPercent,
        s.PositionYPercent
    );
}
