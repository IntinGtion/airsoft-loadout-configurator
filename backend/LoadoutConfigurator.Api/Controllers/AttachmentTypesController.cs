using LoadoutConfigurator.Api.Data;
using LoadoutConfigurator.Api.DTOs;
using LoadoutConfigurator.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LoadoutConfigurator.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AttachmentTypesController(LoadoutContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var types = await db.AttachmentTypes
            .Select(a => new AttachmentTypeResponse(a.Id, a.Name))
            .ToListAsync();
        return Ok(types);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var type = await db.AttachmentTypes.FindAsync(id);
        if (type is null) return NotFound();
        return Ok(new AttachmentTypeResponse(type.Id, type.Name));
    }

    [HttpPost]
    public async Task<IActionResult> Create(AttachmentTypeRequest request)
    {
        var type = new AttachmentType { Name = request.Name };
        db.AttachmentTypes.Add(type);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = type.Id },
            new AttachmentTypeResponse(type.Id, type.Name));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, AttachmentTypeRequest request)
    {
        var type = await db.AttachmentTypes.FindAsync(id);
        if (type is null) return NotFound();
        type.Name = request.Name;
        await db.SaveChangesAsync();
        return Ok(new AttachmentTypeResponse(type.Id, type.Name));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var type = await db.AttachmentTypes.FindAsync(id);
        if (type is null) return NotFound();
        db.AttachmentTypes.Remove(type);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
