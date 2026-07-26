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
            Slots =
            [
                new Slot { AttachmentType = molle, Label = "Front Panel Row 1",    PositionXPercent = 50, PositionYPercent = 22 },
                new Slot { AttachmentType = molle, Label = "Front Panel Row 2",    PositionXPercent = 50, PositionYPercent = 35 },
                new Slot { AttachmentType = molle, Label = "Front Panel Row 3",    PositionXPercent = 50, PositionYPercent = 48 },
                new Slot { AttachmentType = molle, Label = "Left Cummerbund",      PositionXPercent = 15, PositionYPercent = 55 },
                new Slot { AttachmentType = molle, Label = "Right Cummerbund",     PositionXPercent = 85, PositionYPercent = 55 },
                new Slot { AttachmentType = qdSling, Label = "QD Sling Point L",   PositionXPercent = 25, PositionYPercent = 18 },
                new Slot { AttachmentType = qdSling, Label = "QD Sling Point R",   PositionXPercent = 75, PositionYPercent = 18 },
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
            AcceptedAttachmentTypes = [molle]
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
