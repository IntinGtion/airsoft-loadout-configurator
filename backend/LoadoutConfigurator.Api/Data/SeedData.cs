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

        // ── Plate Carriers ───────────────────────────────────────────────────
        var jpc = new Component
        {
            Category = catCarrier,
            Name = "Crye Precision JPC 2.0",
            Manufacturer = "Crye Precision",
            WeightGrams = 1050,
            PriceEur = 349,
            Slots =
            [
                new Slot { AttachmentType = molle, Label = "Front MOLLE Panel",   PositionXPercent = 50, PositionYPercent = 30 },
                new Slot { AttachmentType = molle, Label = "Left Cummerbund",      PositionXPercent = 18, PositionYPercent = 55 },
                new Slot { AttachmentType = molle, Label = "Right Cummerbund",     PositionXPercent = 82, PositionYPercent = 55 },
                new Slot { AttachmentType = qdSling, Label = "QD Sling Point L",   PositionXPercent = 25, PositionYPercent = 20 },
                new Slot { AttachmentType = qdSling, Label = "QD Sling Point R",   PositionXPercent = 75, PositionYPercent = 20 },
            ]
        };

        var fcpc = new Component
        {
            Category = catCarrier,
            Name = "Ferro Concepts FCPC V5",
            Manufacturer = "Ferro Concepts",
            WeightGrams = 820,
            PriceEur = 415,
            Slots =
            [
                new Slot { AttachmentType = molle, Label = "Front MOLLE Panel",   PositionXPercent = 50, PositionYPercent = 28 },
                new Slot { AttachmentType = molle, Label = "Side MOLLE Left",      PositionXPercent = 15, PositionYPercent = 50 },
                new Slot { AttachmentType = molle, Label = "Side MOLLE Right",     PositionXPercent = 85, PositionYPercent = 50 },
                new Slot { AttachmentType = qdSling, Label = "QD Sling Point L",   PositionXPercent = 22, PositionYPercent = 18 },
                new Slot { AttachmentType = qdSling, Label = "QD Sling Point R",   PositionXPercent = 78, PositionYPercent = 18 },
            ]
        };

        var mopc = new Component
        {
            Category = catCarrier,
            Name = "Condor MOPC",
            Manufacturer = "Condor Outdoor",
            WeightGrams = 1200,
            PriceEur = 119,
            SvgAssetPath = "/components/condor-mopc.svg",
            // Slot-Koordinaten aus Figma-Datei "Plattenträger MVP" (Frame PlateCarrier_MOPC_Front) exportiert:
            // absolute Position der MOLLE-Marker-Ellipsen relativ zur Frame-BoundingBox in Prozent umgerechnet.
            Slots =
            [
                new Slot { AttachmentType = molle, Label = "MOLLE 1-1", PositionXPercent = 19.11f, PositionYPercent = 55.43f },
                new Slot { AttachmentType = molle, Label = "MOLLE 1-2", PositionXPercent = 19.11f, PositionYPercent = 62.02f },
                new Slot { AttachmentType = molle, Label = "MOLLE 1-3", PositionXPercent = 19.11f, PositionYPercent = 68.55f },
                new Slot { AttachmentType = molle, Label = "MOLLE 1-4", PositionXPercent = 18.73f, PositionYPercent = 74.64f },
                new Slot { AttachmentType = molle, Label = "MOLLE 1-5", PositionXPercent = 18.34f, PositionYPercent = 80.73f },
                new Slot { AttachmentType = molle, Label = "MOLLE 1-6", PositionXPercent = 17.96f, PositionYPercent = 87.26f },
                new Slot { AttachmentType = molle, Label = "MOLLE 2-1", PositionXPercent = 31.16f, PositionYPercent = 56.12f },
                new Slot { AttachmentType = molle, Label = "MOLLE 2-2", PositionXPercent = 31.16f, PositionYPercent = 62.34f },
                new Slot { AttachmentType = molle, Label = "MOLLE 2-3", PositionXPercent = 30.39f, PositionYPercent = 69.18f },
                new Slot { AttachmentType = molle, Label = "MOLLE 2-4", PositionXPercent = 30.39f, PositionYPercent = 75.27f },
                new Slot { AttachmentType = molle, Label = "MOLLE 2-5", PositionXPercent = 30.39f, PositionYPercent = 81.36f },
                new Slot { AttachmentType = molle, Label = "MOLLE 2-6", PositionXPercent = 30.01f, PositionYPercent = 87.88f },
                new Slot { AttachmentType = molle, Label = "MOLLE 3-1", PositionXPercent = 42.75f, PositionYPercent = 56.12f },
                new Slot { AttachmentType = molle, Label = "MOLLE 3-2", PositionXPercent = 42.75f, PositionYPercent = 62.65f },
                new Slot { AttachmentType = molle, Label = "MOLLE 3-3", PositionXPercent = 42.36f, PositionYPercent = 69.18f },
                new Slot { AttachmentType = molle, Label = "MOLLE 3-4", PositionXPercent = 41.98f, PositionYPercent = 75.71f },
                new Slot { AttachmentType = molle, Label = "MOLLE 3-5", PositionXPercent = 41.98f, PositionYPercent = 81.98f },
                new Slot { AttachmentType = molle, Label = "MOLLE 3-6", PositionXPercent = 42.36f, PositionYPercent = 88.51f },
                new Slot { AttachmentType = molle, Label = "MOLLE 4-1", PositionXPercent = 54.34f, PositionYPercent = 56.75f },
                new Slot { AttachmentType = molle, Label = "MOLLE 4-2", PositionXPercent = 54.72f, PositionYPercent = 63.28f },
                new Slot { AttachmentType = molle, Label = "MOLLE 4-3", PositionXPercent = 54.72f, PositionYPercent = 69.18f },
                new Slot { AttachmentType = molle, Label = "MOLLE 4-4", PositionXPercent = 54.34f, PositionYPercent = 75.89f },
                new Slot { AttachmentType = molle, Label = "MOLLE 4-5", PositionXPercent = 53.95f, PositionYPercent = 82.61f },
                new Slot { AttachmentType = molle, Label = "MOLLE 4-6", PositionXPercent = 53.95f, PositionYPercent = 88.83f },
                new Slot { AttachmentType = molle, Label = "MOLLE 5-1", PositionXPercent = 67.31f, PositionYPercent = 56.75f },
                new Slot { AttachmentType = molle, Label = "MOLLE 5-2", PositionXPercent = 66.69f, PositionYPercent = 63.28f },
                new Slot { AttachmentType = molle, Label = "MOLLE 5-3", PositionXPercent = 66.54f, PositionYPercent = 69.81f },
                new Slot { AttachmentType = molle, Label = "MOLLE 5-4", PositionXPercent = 66.54f, PositionYPercent = 75.89f },
                new Slot { AttachmentType = molle, Label = "MOLLE 5-5", PositionXPercent = 65.77f, PositionYPercent = 82.61f },
                new Slot { AttachmentType = molle, Label = "MOLLE 5-6", PositionXPercent = 65.54f, PositionYPercent = 88.83f },
                new Slot { AttachmentType = molle, Label = "MOLLE 6-1", PositionXPercent = 78.51f, PositionYPercent = 56.75f },
                new Slot { AttachmentType = molle, Label = "MOLLE 6-2", PositionXPercent = 78.28f, PositionYPercent = 63.28f },
                new Slot { AttachmentType = molle, Label = "MOLLE 6-3", PositionXPercent = 78.28f, PositionYPercent = 69.81f },
                new Slot { AttachmentType = molle, Label = "MOLLE 6-4", PositionXPercent = 78.28f, PositionYPercent = 75.89f },
                new Slot { AttachmentType = molle, Label = "MOLLE 6-5", PositionXPercent = 77.36f, PositionYPercent = 82.42f },
                new Slot { AttachmentType = molle, Label = "MOLLE 6-6", PositionXPercent = 77.74f, PositionYPercent = 88.51f },
            ]
        };

        // ── Assault Rifles ───────────────────────────────────────────────────
        var mws = new Component
        {
            Category = catRifle,
            Name = "Tokyo Marui MWS GBBR",
            Manufacturer = "Tokyo Marui",
            WeightGrams = 3200,
            PriceEur = 589,
            Slots =
            [
                new Slot { AttachmentType = picatinny, Label = "Top Rail",         PositionXPercent = 45, PositionYPercent = 12 },
                new Slot { AttachmentType = mlok,      Label = "Left Rail",         PositionXPercent = 22, PositionYPercent = 38 },
                new Slot { AttachmentType = mlok,      Label = "Right Rail",        PositionXPercent = 78, PositionYPercent = 38 },
                new Slot { AttachmentType = mlok,      Label = "Bottom Rail",       PositionXPercent = 45, PositionYPercent = 62 },
                new Slot { AttachmentType = qdSling,   Label = "QD Sling Point",    PositionXPercent = 85, PositionYPercent = 45 },
            ]
        };

        var weM4 = new Component
        {
            Category = catRifle,
            Name = "WE-Tech M4 GBBR",
            Manufacturer = "WE-Tech",
            WeightGrams = 2900,
            PriceEur = 279,
            Slots =
            [
                new Slot { AttachmentType = picatinny, Label = "Top Rail",         PositionXPercent = 45, PositionYPercent = 12 },
                new Slot { AttachmentType = picatinny, Label = "Left Rail",        PositionXPercent = 22, PositionYPercent = 38 },
                new Slot { AttachmentType = picatinny, Label = "Right Rail",       PositionXPercent = 78, PositionYPercent = 38 },
                new Slot { AttachmentType = picatinny, Label = "Bottom Rail",      PositionXPercent = 45, PositionYPercent = 62 },
                new Slot { AttachmentType = qdSling,   Label = "QD Sling Point",   PositionXPercent = 85, PositionYPercent = 45 },
            ]
        };

        var cxp = new Component
        {
            Category = catRifle,
            Name = "ICS CXP-UK1 Captain",
            Manufacturer = "ICS",
            WeightGrams = 2750,
            PriceEur = 389,
            Slots =
            [
                new Slot { AttachmentType = picatinny, Label = "Top Rail",         PositionXPercent = 45, PositionYPercent = 12 },
                new Slot { AttachmentType = mlok,      Label = "Left Rail",        PositionXPercent = 22, PositionYPercent = 38 },
                new Slot { AttachmentType = mlok,      Label = "Right Rail",       PositionXPercent = 78, PositionYPercent = 38 },
                new Slot { AttachmentType = mlok,      Label = "Bottom Rail",      PositionXPercent = 45, PositionYPercent = 62 },
                new Slot { AttachmentType = qdSling,   Label = "QD Sling Point",   PositionXPercent = 85, PositionYPercent = 45 },
            ]
        };

        // ── Pistols ──────────────────────────────────────────────────────────
        var hicapa = new Component
        {
            Category = catPistol,
            Name = "Tokyo Marui Hi-Capa 5.1",
            Manufacturer = "Tokyo Marui",
            WeightGrams = 910,
            PriceEur = 179,
            Slots =
            [
                new Slot { AttachmentType = picatinny, Label = "Underslung Rail",  PositionXPercent = 50, PositionYPercent = 72 },
            ]
        };

        var g17 = new Component
        {
            Category = catPistol,
            Name = "WE-Tech G17 Gen4 GBB",
            Manufacturer = "WE-Tech",
            WeightGrams = 780,
            PriceEur = 119,
            Slots =
            [
                new Slot { AttachmentType = picatinny, Label = "Underslung Rail",  PositionXPercent = 50, PositionYPercent = 72 },
            ]
        };

        // ── Optics (attach via Picatinny or M-LOK) ───────────────────────────
        var aimpoint = new Component
        {
            Category = catOptic,
            Name = "Aimpoint T2 Micro",
            Manufacturer = "Aimpoint",
            WeightGrams = 420,
            PriceEur = 899,
            AcceptedAttachmentTypes = [picatinny]
        };

        var eotech = new Component
        {
            Category = catOptic,
            Name = "EOTech 553",
            Manufacturer = "EOTech",
            WeightGrams = 510,
            PriceEur = 649,
            AcceptedAttachmentTypes = [picatinny]
        };

        var vortex = new Component
        {
            Category = catOptic,
            Name = "Vortex Crossfire Red Dot",
            Manufacturer = "Vortex Optics",
            WeightGrams = 185,
            PriceEur = 179,
            AcceptedAttachmentTypes = [picatinny]
        };

        var eotech2 = new Component
        {
            Category = catOptic,
            Name = "EOTech XPS3",
            Manufacturer = "EOTech",
            WeightGrams = 370,
            PriceEur = 729,
            AcceptedAttachmentTypes = [picatinny]
        };

        // ── Pouches (attach via MOLLE) ────────────────────────────────────────
        var adminPouch = new Component
        {
            Category = catPouch,
            Name = "Condor Admin Pouch",
            Manufacturer = "Condor Outdoor",
            WeightGrams = 220,
            PriceEur = 28,
            AcceptedAttachmentTypes = [molle]
        };

        var magPouch = new Component
        {
            Category = catPouch,
            Name = "WAS Double Mag Pouch",
            Manufacturer = "Warrior Assault Systems",
            WeightGrams = 180,
            PriceEur = 44,
            AcceptedAttachmentTypes = [molle]
        };

        var tenSpeed = new Component
        {
            Category = catPouch,
            Name = "BFG Ten-Speed M4 Pouch",
            Manufacturer = "Blue Force Gear",
            WeightGrams = 120,
            PriceEur = 64,
            SvgAssetPath = "/components/bfg-tenspeed.svg",
            AcceptedAttachmentTypes = [molle],
            // MountPoints aus Figma-Datei "M4 Pouch MVP" (Frame M4Pouch_MOPC_Front): eigene
            // MOLLE-Straps auf der Rückseite, mit denen die Pouch am Plattenträger andockt.
            MountPoints =
            [
                new MountPoint { AttachmentType = molle, Label = "MOLLE 1-1", PositionXPercent = 27.05f, PositionYPercent = 14.02f },
                new MountPoint { AttachmentType = molle, Label = "MOLLE 1-2", PositionXPercent = 27.82f, PositionYPercent = 31.8f },
                new MountPoint { AttachmentType = molle, Label = "MOLLE 1-3", PositionXPercent = 27.05f, PositionYPercent = 50.04f },
                new MountPoint { AttachmentType = molle, Label = "MOLLE 1-4", PositionXPercent = 27.05f, PositionYPercent = 67.82f },
                new MountPoint { AttachmentType = molle, Label = "MOLLE 2-1", PositionXPercent = 72.44f, PositionYPercent = 14.02f },
                new MountPoint { AttachmentType = molle, Label = "MOLLE 2-2", PositionXPercent = 72.44f, PositionYPercent = 31.8f },
                new MountPoint { AttachmentType = molle, Label = "MOLLE 2-3", PositionXPercent = 72.44f, PositionYPercent = 50.04f },
                new MountPoint { AttachmentType = molle, Label = "MOLLE 2-4", PositionXPercent = 72.44f, PositionYPercent = 67.97f },
            ]
        };

        var ifak = new Component
        {
            Category = catPouch,
            Name = "North American Rescue IFAK",
            Manufacturer = "North American Rescue",
            WeightGrams = 340,
            PriceEur = 89,
            AcceptedAttachmentTypes = [molle]
        };

        db.Components.AddRange(
            jpc, fcpc, mopc,
            mws, weM4, cxp,
            hicapa, g17,
            aimpoint, eotech, vortex, eotech2,
            adminPouch, magPouch, tenSpeed, ifak
        );

        await db.SaveChangesAsync();
    }
}
