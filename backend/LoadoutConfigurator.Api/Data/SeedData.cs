using LoadoutConfigurator.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace LoadoutConfigurator.Api.Data;

public static class SeedData
{
    public static async Task InitializeAsync(IServiceProvider services)
    {
        var db = services.GetRequiredService<LoadoutContext>();

        await db.Database.MigrateAsync();

        if (await db.AttachmentTypes.AnyAsync())
            return;

        // ── Attachment Types ─────────────────────────────────────────────────
        // Kept as reusable taxonomy even though only MOLLE is used by the current
        // 2 real components below — will be needed again once more real assets land.
        var molle     = new AttachmentType { Name = "MOLLE" };
        var picatinny = new AttachmentType { Name = "Picatinny" };
        var mlok      = new AttachmentType { Name = "M-LOK" };
        var qdSling   = new AttachmentType { Name = "QD-Sling" };

        db.AttachmentTypes.AddRange(molle, picatinny, mlok, qdSling);

        // ── Categories ───────────────────────────────────────────────────────
        var catCarrier  = new Category { Name = "Plate Carrier",  Icon = "plate-carrier"  };
        var catRifle    = new Category { Name = "Assault Rifle",  Icon = "rifle"          };
        var catPistol   = new Category { Name = "Pistol",         Icon = "pistol"         };
        var catOptic    = new Category { Name = "Optic",          Icon = "optic"          };
        var catPouch    = new Category { Name = "Pouch",          Icon = "pouch"          };

        db.Categories.AddRange(catCarrier, catRifle, catPistol, catOptic, catPouch);

        // ── Plate Carrier ────────────────────────────────────────────────────
        // Generic template for light plate carriers (Figma file Oj2mnCJzmOD1h7D7LnkNZo,
        // exported manually by the project owner — see DEVELOPMENT.md section 4 for why
        // the Figma REST API is now only used for coordinate extraction, not SVG export).
        // 52 MOLLE slots in a 4-wide chest area (rows 1-4) + 6-wide torso area (rows 5-10).
        // Marker naming on this asset is "MOLLE_Slot{col}_Row{row}" (note: reversed order
        // vs. the "Slot{col}_MOLLE_Row{row}" convention used on Condor MOPC).
        var jpcTemplate = new ComponentTemplate
        {
            Name = "JPC Plate Carrier",
            SvgAssetPath = "/components/jpc-plate-carrier.svg",
            Slots =
            [
                new Slot { AttachmentType = molle, Label = "MOLLE 1-1", PositionXPercent = 35.17f, PositionYPercent = 32.2f, GridColumn = 1, GridRow = 1 },
                new Slot { AttachmentType = molle, Label = "MOLLE 2-1", PositionXPercent = 45.46f, PositionYPercent = 32.2f, GridColumn = 2, GridRow = 1 },
                new Slot { AttachmentType = molle, Label = "MOLLE 3-1", PositionXPercent = 54.63f, PositionYPercent = 32.2f, GridColumn = 3, GridRow = 1 },
                new Slot { AttachmentType = molle, Label = "MOLLE 4-1", PositionXPercent = 64.92f, PositionYPercent = 32.2f, GridColumn = 4, GridRow = 1 },
                new Slot { AttachmentType = molle, Label = "MOLLE 1-2", PositionXPercent = 35.17f, PositionYPercent = 38.44f, GridColumn = 1, GridRow = 2 },
                new Slot { AttachmentType = molle, Label = "MOLLE 2-2", PositionXPercent = 45.46f, PositionYPercent = 38.44f, GridColumn = 2, GridRow = 2 },
                new Slot { AttachmentType = molle, Label = "MOLLE 3-2", PositionXPercent = 54.63f, PositionYPercent = 38.44f, GridColumn = 3, GridRow = 2 },
                new Slot { AttachmentType = molle, Label = "MOLLE 4-2", PositionXPercent = 64.92f, PositionYPercent = 38.44f, GridColumn = 4, GridRow = 2 },
                new Slot { AttachmentType = molle, Label = "MOLLE 1-3", PositionXPercent = 35.08f, PositionYPercent = 44.23f, GridColumn = 1, GridRow = 3 },
                new Slot { AttachmentType = molle, Label = "MOLLE 2-3", PositionXPercent = 45.37f, PositionYPercent = 44.23f, GridColumn = 2, GridRow = 3 },
                new Slot { AttachmentType = molle, Label = "MOLLE 3-3", PositionXPercent = 54.54f, PositionYPercent = 44.23f, GridColumn = 3, GridRow = 3 },
                new Slot { AttachmentType = molle, Label = "MOLLE 4-3", PositionXPercent = 64.83f, PositionYPercent = 44.23f, GridColumn = 4, GridRow = 3 },
                new Slot { AttachmentType = molle, Label = "MOLLE 1-4", PositionXPercent = 35.08f, PositionYPercent = 50.29f, GridColumn = 1, GridRow = 4 },
                new Slot { AttachmentType = molle, Label = "MOLLE 2-4", PositionXPercent = 45.37f, PositionYPercent = 50.29f, GridColumn = 2, GridRow = 4 },
                new Slot { AttachmentType = molle, Label = "MOLLE 3-4", PositionXPercent = 54.54f, PositionYPercent = 50.29f, GridColumn = 3, GridRow = 4 },
                new Slot { AttachmentType = molle, Label = "MOLLE 4-4", PositionXPercent = 64.83f, PositionYPercent = 50.29f, GridColumn = 4, GridRow = 4 },
                new Slot { AttachmentType = molle, Label = "MOLLE 1-5", PositionXPercent = 24.98f, PositionYPercent = 64.99f, GridColumn = 1, GridRow = 5 },
                new Slot { AttachmentType = molle, Label = "MOLLE 2-5", PositionXPercent = 35.26f, PositionYPercent = 64.99f, GridColumn = 2, GridRow = 5 },
                new Slot { AttachmentType = molle, Label = "MOLLE 3-5", PositionXPercent = 44.44f, PositionYPercent = 64.99f, GridColumn = 3, GridRow = 5 },
                new Slot { AttachmentType = molle, Label = "MOLLE 4-5", PositionXPercent = 54.73f, PositionYPercent = 64.99f, GridColumn = 4, GridRow = 5 },
                new Slot { AttachmentType = molle, Label = "MOLLE 5-5", PositionXPercent = 64.83f, PositionYPercent = 64.99f, GridColumn = 5, GridRow = 5 },
                new Slot { AttachmentType = molle, Label = "MOLLE 6-5", PositionXPercent = 75.12f, PositionYPercent = 64.99f, GridColumn = 6, GridRow = 5 },
                new Slot { AttachmentType = molle, Label = "MOLLE 1-6", PositionXPercent = 24.98f, PositionYPercent = 71.14f, GridColumn = 1, GridRow = 6 },
                new Slot { AttachmentType = molle, Label = "MOLLE 2-6", PositionXPercent = 35.26f, PositionYPercent = 71.14f, GridColumn = 2, GridRow = 6 },
                new Slot { AttachmentType = molle, Label = "MOLLE 3-6", PositionXPercent = 44.44f, PositionYPercent = 71.14f, GridColumn = 3, GridRow = 6 },
                new Slot { AttachmentType = molle, Label = "MOLLE 4-6", PositionXPercent = 54.73f, PositionYPercent = 71.14f, GridColumn = 4, GridRow = 6 },
                new Slot { AttachmentType = molle, Label = "MOLLE 5-6", PositionXPercent = 64.83f, PositionYPercent = 71.14f, GridColumn = 5, GridRow = 6 },
                new Slot { AttachmentType = molle, Label = "MOLLE 6-6", PositionXPercent = 75.12f, PositionYPercent = 71.14f, GridColumn = 6, GridRow = 6 },
                new Slot { AttachmentType = molle, Label = "MOLLE 1-7", PositionXPercent = 24.98f, PositionYPercent = 76.93f, GridColumn = 1, GridRow = 7 },
                new Slot { AttachmentType = molle, Label = "MOLLE 2-7", PositionXPercent = 35.26f, PositionYPercent = 76.93f, GridColumn = 2, GridRow = 7 },
                new Slot { AttachmentType = molle, Label = "MOLLE 3-7", PositionXPercent = 44.44f, PositionYPercent = 76.93f, GridColumn = 3, GridRow = 7 },
                new Slot { AttachmentType = molle, Label = "MOLLE 4-7", PositionXPercent = 54.73f, PositionYPercent = 76.93f, GridColumn = 4, GridRow = 7 },
                new Slot { AttachmentType = molle, Label = "MOLLE 5-7", PositionXPercent = 64.83f, PositionYPercent = 76.93f, GridColumn = 5, GridRow = 7 },
                new Slot { AttachmentType = molle, Label = "MOLLE 6-7", PositionXPercent = 75.12f, PositionYPercent = 76.93f, GridColumn = 6, GridRow = 7 },
                new Slot { AttachmentType = molle, Label = "MOLLE 1-8", PositionXPercent = 24.98f, PositionYPercent = 83.07f, GridColumn = 1, GridRow = 8 },
                new Slot { AttachmentType = molle, Label = "MOLLE 2-8", PositionXPercent = 35.26f, PositionYPercent = 83.07f, GridColumn = 2, GridRow = 8 },
                new Slot { AttachmentType = molle, Label = "MOLLE 3-8", PositionXPercent = 44.44f, PositionYPercent = 83.07f, GridColumn = 3, GridRow = 8 },
                new Slot { AttachmentType = molle, Label = "MOLLE 4-8", PositionXPercent = 54.73f, PositionYPercent = 83.07f, GridColumn = 4, GridRow = 8 },
                new Slot { AttachmentType = molle, Label = "MOLLE 5-8", PositionXPercent = 64.83f, PositionYPercent = 83.07f, GridColumn = 5, GridRow = 8 },
                new Slot { AttachmentType = molle, Label = "MOLLE 6-8", PositionXPercent = 75.12f, PositionYPercent = 83.07f, GridColumn = 6, GridRow = 8 },
                new Slot { AttachmentType = molle, Label = "MOLLE 1-9", PositionXPercent = 24.98f, PositionYPercent = 89.22f, GridColumn = 1, GridRow = 9 },
                new Slot { AttachmentType = molle, Label = "MOLLE 2-9", PositionXPercent = 35.26f, PositionYPercent = 89.22f, GridColumn = 2, GridRow = 9 },
                new Slot { AttachmentType = molle, Label = "MOLLE 3-9", PositionXPercent = 44.44f, PositionYPercent = 89.22f, GridColumn = 3, GridRow = 9 },
                new Slot { AttachmentType = molle, Label = "MOLLE 4-9", PositionXPercent = 54.73f, PositionYPercent = 89.22f, GridColumn = 4, GridRow = 9 },
                new Slot { AttachmentType = molle, Label = "MOLLE 5-9", PositionXPercent = 64.83f, PositionYPercent = 89.22f, GridColumn = 5, GridRow = 9 },
                new Slot { AttachmentType = molle, Label = "MOLLE 6-9", PositionXPercent = 75.12f, PositionYPercent = 89.22f, GridColumn = 6, GridRow = 9 },
                new Slot { AttachmentType = molle, Label = "MOLLE 1-10", PositionXPercent = 24.98f, PositionYPercent = 95.37f, GridColumn = 1, GridRow = 10 },
                new Slot { AttachmentType = molle, Label = "MOLLE 2-10", PositionXPercent = 35.26f, PositionYPercent = 95.37f, GridColumn = 2, GridRow = 10 },
                new Slot { AttachmentType = molle, Label = "MOLLE 3-10", PositionXPercent = 44.44f, PositionYPercent = 95.37f, GridColumn = 3, GridRow = 10 },
                new Slot { AttachmentType = molle, Label = "MOLLE 4-10", PositionXPercent = 54.73f, PositionYPercent = 95.37f, GridColumn = 4, GridRow = 10 },
                new Slot { AttachmentType = molle, Label = "MOLLE 5-10", PositionXPercent = 64.83f, PositionYPercent = 95.37f, GridColumn = 5, GridRow = 10 },
                new Slot { AttachmentType = molle, Label = "MOLLE 6-10", PositionXPercent = 75.12f, PositionYPercent = 95.37f, GridColumn = 6, GridRow = 10 },
            ]
        };
        var jpc = new Component
        {
            Category = catCarrier,
            ComponentTemplate = jpcTemplate,
            Name = "JPC Plate Carrier",
        };

        // ── Pouch ────────────────────────────────────────────────────────────
        var openFastMagPouchTemplate = new ComponentTemplate
        {
            Name = "Open Fast Mag Pouch",
            RealWidthMm = 80,
            SvgAssetPath = "/components/open-fast-mag-pouch.svg",
            AcceptedAttachmentTypes = [molle],
            // MountPoints aus Figma-Datei "M4 Pouch MVP": eigene MOLLE-Straps auf der
            // Rückseite, mit denen die Pouch am Plattenträger andockt.
            MountPoints =
            [
                new MountPoint { AttachmentType = molle, Label = "MOLLE 1-1", PositionXPercent = 27.05f, PositionYPercent = 14.02f, GridColumn = 1, GridRow = 1 },
                new MountPoint { AttachmentType = molle, Label = "MOLLE 1-2", PositionXPercent = 27.82f, PositionYPercent = 31.8f, GridColumn = 1, GridRow = 2 },
                new MountPoint { AttachmentType = molle, Label = "MOLLE 1-3", PositionXPercent = 27.05f, PositionYPercent = 50.04f, GridColumn = 1, GridRow = 3 },
                new MountPoint { AttachmentType = molle, Label = "MOLLE 1-4", PositionXPercent = 27.05f, PositionYPercent = 67.82f, GridColumn = 1, GridRow = 4 },
                new MountPoint { AttachmentType = molle, Label = "MOLLE 2-1", PositionXPercent = 72.44f, PositionYPercent = 14.02f, GridColumn = 2, GridRow = 1 },
                new MountPoint { AttachmentType = molle, Label = "MOLLE 2-2", PositionXPercent = 72.44f, PositionYPercent = 31.8f, GridColumn = 2, GridRow = 2 },
                new MountPoint { AttachmentType = molle, Label = "MOLLE 2-3", PositionXPercent = 72.44f, PositionYPercent = 50.04f, GridColumn = 2, GridRow = 3 },
                new MountPoint { AttachmentType = molle, Label = "MOLLE 2-4", PositionXPercent = 72.44f, PositionYPercent = 67.97f, GridColumn = 2, GridRow = 4 },
            ]
        };
        var openFastMagPouch = new Component
        {
            Category = catPouch,
            ComponentTemplate = openFastMagPouchTemplate,
            Name = "Open Fast Mag Pouch",
        };

        db.Components.AddRange(jpc, openFastMagPouch);

        await db.SaveChangesAsync();
    }
}
