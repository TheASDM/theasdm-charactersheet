-- AlterTable - Update items table to match current schema
-- Drop old columns
ALTER TABLE "items" DROP COLUMN IF EXISTS "category";
ALTER TABLE "items" DROP COLUMN IF EXISTS "requires_attunement";
ALTER TABLE "items" DROP COLUMN IF EXISTS "description";
ALTER TABLE "items" DROP COLUMN IF EXISTS "properties";
ALTER TABLE "items" DROP COLUMN IF EXISTS "cost";
ALTER TABLE "items" DROP COLUMN IF EXISTS "damage_type";
ALTER TABLE "items" DROP COLUMN IF EXISTS "damage_dice";
ALTER TABLE "items" DROP COLUMN IF EXISTS "armor_class";

-- Add new columns to match schema.prisma
ALTER TABLE "items" ADD COLUMN "source" VARCHAR(20);
ALTER TABLE "items" ADD COLUMN "page" INTEGER;
ALTER TABLE "items" ADD COLUMN "type_alt" VARCHAR(50);
ALTER TABLE "items" ADD COLUMN "value" INTEGER;
ALTER TABLE "items" ADD COLUMN "value_currency" VARCHAR(10);
ALTER TABLE "items" ADD COLUMN "entries" JSONB;
ALTER TABLE "items" ADD COLUMN "additional_entries" JSONB;
ALTER TABLE "items" ADD COLUMN "weapon_category" VARCHAR(20);
ALTER TABLE "items" ADD COLUMN "property" TEXT[];
ALTER TABLE "items" ADD COLUMN "range" TEXT;
ALTER TABLE "items" ADD COLUMN "dmg1" TEXT;
ALTER TABLE "items" ADD COLUMN "dmg2" TEXT;
ALTER TABLE "items" ADD COLUMN "dmg_type" VARCHAR(20);
ALTER TABLE "items" ADD COLUMN "ac" INTEGER;
ALTER TABLE "items" ADD COLUMN "strength" INTEGER;
ALTER TABLE "items" ADD COLUMN "stealth" BOOLEAN;
ALTER TABLE "items" ADD COLUMN "armor_type" VARCHAR(20);
ALTER TABLE "items" ADD COLUMN "req_attune" VARCHAR(50);
ALTER TABLE "items" ADD COLUMN "charges" INTEGER;
ALTER TABLE "items" ADD COLUMN "recharge" TEXT;
ALTER TABLE "items" ADD COLUMN "modify_speed" JSONB;
ALTER TABLE "items" ADD COLUMN "bonus_weapon" TEXT;
ALTER TABLE "items" ADD COLUMN "bonus_ac" INTEGER;
ALTER TABLE "items" ADD COLUMN "bonus_spell_attack" INTEGER;
ALTER TABLE "items" ADD COLUMN "bonus_spell_save_dc" INTEGER;
ALTER TABLE "items" ADD COLUMN "spells" JSONB;
ALTER TABLE "items" ADD COLUMN "base_item" TEXT;
ALTER TABLE "items" ADD COLUMN "variants" JSONB;
ALTER TABLE "items" ADD COLUMN "srd52" BOOLEAN;
ALTER TABLE "items" ADD COLUMN "basic_rules_2024" BOOLEAN;
ALTER TABLE "items" ADD COLUMN "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "items" ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE UNIQUE INDEX "items_name_source_key" ON "items"("name", "source");
