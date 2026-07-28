using LoadoutConfigurator.Api.Data;
using LoadoutConfigurator.Api.DTOs;
using LoadoutConfigurator.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LoadoutConfigurator.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ComponentsController(LoadoutContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? categoryId)
    {
        var query = db.Components
            .Include(c => c.Category)
            .Include(c => c.ComponentTemplate).ThenInclude(t => t.Slots).ThenInclude(s => s.AttachmentType)
            .Include(c => c.ComponentTemplate).ThenInclude(t => t.AcceptedAttachmentTypes)
            .Include(c => c.ComponentTemplate).ThenInclude(t => t.MountPoints).ThenInclude(m => m.AttachmentType)
            .AsQueryable();

        if (categoryId.HasValue)
            query = query.Where(c => c.CategoryId == categoryId.Value);

        var components = (await query.ToListAsync()).Select(ToResponse).ToList();
        return Ok(components);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var component = await db.Components
            .Include(c => c.Category)
            .Include(c => c.ComponentTemplate).ThenInclude(t => t.Slots).ThenInclude(s => s.AttachmentType)
            .Include(c => c.ComponentTemplate).ThenInclude(t => t.AcceptedAttachmentTypes)
            .Include(c => c.ComponentTemplate).ThenInclude(t => t.MountPoints).ThenInclude(m => m.AttachmentType)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (component is null) return NotFound();
        return Ok(ToResponse(component));
    }

    [HttpPost]
    public async Task<IActionResult> Create(ComponentRequest request)
    {
        if (!await db.Categories.AnyAsync(c => c.Id == request.CategoryId))
            return BadRequest(new { error = "Category not found." });

        if (!await db.ComponentTemplates.AnyAsync(t => t.Id == request.ComponentTemplateId))
            return BadRequest(new { error = "ComponentTemplate not found." });

        var component = new Component
        {
            CategoryId = request.CategoryId,
            ComponentTemplateId = request.ComponentTemplateId,
            Name = request.Name,
            Manufacturer = request.Manufacturer,
            WeightGrams = request.WeightGrams,
            PriceEur = request.PriceEur
        };

        db.Components.Add(component);
        await db.SaveChangesAsync();

        var created = await LoadFull(component.Id);
        return CreatedAtAction(nameof(GetById), new { id = component.Id }, ToResponse(created!));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, ComponentRequest request)
    {
        var component = await db.Components.FirstOrDefaultAsync(c => c.Id == id);
        if (component is null) return NotFound();

        if (!await db.Categories.AnyAsync(c => c.Id == request.CategoryId))
            return BadRequest(new { error = "Category not found." });

        if (!await db.ComponentTemplates.AnyAsync(t => t.Id == request.ComponentTemplateId))
            return BadRequest(new { error = "ComponentTemplate not found." });

        component.CategoryId = request.CategoryId;
        component.ComponentTemplateId = request.ComponentTemplateId;
        component.Name = request.Name;
        component.Manufacturer = request.Manufacturer;
        component.WeightGrams = request.WeightGrams;
        component.PriceEur = request.PriceEur;

        await db.SaveChangesAsync();

        var updated = await LoadFull(component.Id);
        return Ok(ToResponse(updated!));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var component = await db.Components.FindAsync(id);
        if (component is null) return NotFound();
        db.Components.Remove(component);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private Task<Component?> LoadFull(int id) =>
        db.Components
            .Include(c => c.Category)
            .Include(c => c.ComponentTemplate).ThenInclude(t => t.Slots).ThenInclude(s => s.AttachmentType)
            .Include(c => c.ComponentTemplate).ThenInclude(t => t.AcceptedAttachmentTypes)
            .Include(c => c.ComponentTemplate).ThenInclude(t => t.MountPoints).ThenInclude(m => m.AttachmentType)
            .FirstOrDefaultAsync(c => c.Id == id);

    private static ComponentResponse ToResponse(Component c) => new(
        c.Id,
        c.CategoryId,
        c.Category.Name,
        c.Name,
        c.Manufacturer,
        c.WeightGrams,
        c.PriceEur,
        c.ComponentTemplate.SvgAssetPath,
        c.ComponentTemplate.RealWidthMm,
        c.ComponentTemplate.Slots.Select(s => new SlotResponse(
            s.Id,
            s.AttachmentTypeId,
            s.AttachmentType.Name,
            s.Label,
            s.PositionXPercent,
            s.PositionYPercent,
            s.GridColumn,
            s.GridRow
        )).ToList(),
        c.ComponentTemplate.AcceptedAttachmentTypes.Select(a => new AttachmentTypeResponse(a.Id, a.Name)).ToList(),
        c.ComponentTemplate.MountPoints.Select(m => new MountPointResponse(
            m.Id,
            m.AttachmentTypeId,
            m.AttachmentType.Name,
            m.Label,
            m.PositionXPercent,
            m.PositionYPercent,
            m.GridColumn,
            m.GridRow
        )).ToList()
    );
}
