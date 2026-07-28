using LoadoutConfigurator.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace LoadoutConfigurator.Api.Data;

public class LoadoutContext : DbContext
{
    public LoadoutContext(DbContextOptions<LoadoutContext> options) : base(options) { }

    public DbSet<Category> Categories { get; set; } = null!;
    public DbSet<ComponentTemplate> ComponentTemplates { get; set; } = null!;
    public DbSet<Component> Components { get; set; } = null!;
    public DbSet<AttachmentType> AttachmentTypes { get; set; } = null!;
    public DbSet<Slot> Slots { get; set; } = null!;
    public DbSet<MountPoint> MountPoints { get; set; } = null!;
    public DbSet<Loadout> Loadouts { get; set; } = null!;
    public DbSet<LoadoutItem> LoadoutItems { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // AcceptedAttachmentTypes is many-to-many: one AttachmentType (e.g. "MOLLE")
        // can be accepted by many ComponentTemplates, and one ComponentTemplate can accept many types.
        modelBuilder.Entity<ComponentTemplate>()
            .HasMany(t => t.AcceptedAttachmentTypes)
            .WithMany()
            .UsingEntity("ComponentTemplateAcceptedAttachmentType");
    }
}
