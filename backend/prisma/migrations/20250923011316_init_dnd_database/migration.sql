-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "discord_id" BIGINT,
    "username" VARCHAR(50) NOT NULL,
    "email" VARCHAR(255),
    "is_dm" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "characters" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "character_data" JSONB NOT NULL,
    "password_hash" VARCHAR(255),
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "campaign_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "characters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "dm_id" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spells" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "source" VARCHAR(20),
    "page" INTEGER,
    "level" INTEGER NOT NULL,
    "school" VARCHAR(1),
    "time" JSONB,
    "range" JSONB,
    "components" JSONB,
    "duration" JSONB,
    "entries" JSONB,
    "entries_higher_level" JSONB,
    "scaling_level_dice" JSONB,
    "damage_inflict" TEXT[],
    "condition_inflict" TEXT[],
    "saving_throw" TEXT[],
    "affects_creature_type" TEXT[],
    "misc_tags" TEXT[],
    "area_tags" TEXT[],
    "srd52" BOOLEAN,
    "basic_rules_2024" BOOLEAN,
    "is_ritual" BOOLEAN,
    "source_book" VARCHAR(100),
    "content_version" VARCHAR(20) NOT NULL,
    "is_homebrew" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "spells_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spell_schools" (
    "id" VARCHAR(1) NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "description" TEXT,

    CONSTRAINT "spell_schools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "damage_types" (
    "id" VARCHAR(20) NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "description" TEXT,

    CONSTRAINT "damage_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conditions" (
    "id" VARCHAR(20) NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "description" TEXT,

    CONSTRAINT "conditions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creature_types" (
    "id" VARCHAR(20) NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "description" TEXT,

    CONSTRAINT "creature_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classes" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "source" VARCHAR(20),
    "page" INTEGER,
    "hit_die" INTEGER NOT NULL,
    "primary_ability" TEXT[],
    "saving_throw_proficiencies" TEXT[],
    "armor_proficiencies" JSONB,
    "weapon_proficiencies" JSONB,
    "tool_proficiencies" JSONB,
    "skill_proficiencies" JSONB,
    "class_features" JSONB,
    "subclass_features" JSONB,
    "spellcasting" JSONB,
    "spellcasting_ability" TEXT,
    "srd52" BOOLEAN,
    "basic_rules_2024" BOOLEAN,
    "source_book" VARCHAR(100),
    "content_version" VARCHAR(20) NOT NULL,
    "is_homebrew" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "species" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "source" VARCHAR(20),
    "page" INTEGER,
    "size" VARCHAR(20) NOT NULL,
    "speed" INTEGER NOT NULL,
    "additional_speeds" JSONB,
    "creature_type" TEXT NOT NULL DEFAULT 'humanoid',
    "lifespan" TEXT,
    "traits" JSONB,
    "ability_score_increase" JSONB,
    "languages" TEXT[],
    "language_options" JSONB,
    "skill_proficiencies" JSONB,
    "tool_proficiencies" JSONB,
    "weapon_proficiencies" JSONB,
    "innate_spells" JSONB,
    "srd52" BOOLEAN,
    "basic_rules_2024" BOOLEAN,
    "source_book" VARCHAR(100),
    "content_version" VARCHAR(20) NOT NULL,
    "is_homebrew" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "species_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "backgrounds" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "skill_proficiencies" JSONB,
    "languages" TEXT[],
    "equipment" JSONB,
    "feature" JSONB,
    "origin_feat" TEXT,
    "ability_score_increase" JSONB,
    "content_version" VARCHAR(20) NOT NULL,

    CONSTRAINT "backgrounds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "category" VARCHAR(50),
    "rarity" VARCHAR(20),
    "requires_attunement" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "properties" JSONB,
    "cost" JSONB,
    "weight" DOUBLE PRECISION,
    "damage_type" VARCHAR(20),
    "damage_dice" VARCHAR(20),
    "armor_class" INTEGER,
    "source_book" VARCHAR(100),
    "content_version" VARCHAR(20) NOT NULL,
    "is_homebrew" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_versions" (
    "id" SERIAL NOT NULL,
    "version" VARCHAR(20) NOT NULL,
    "release_date" TIMESTAMP(3),
    "description" TEXT,
    "breaking_changes" BOOLEAN NOT NULL DEFAULT false,
    "migration_scripts" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "character_version_history" (
    "id" SERIAL NOT NULL,
    "character_id" INTEGER NOT NULL,
    "version_applied" VARCHAR(20) NOT NULL,
    "applied_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "migration_notes" TEXT,

    CONSTRAINT "character_version_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_discord_id_key" ON "users"("discord_id");

-- CreateIndex
CREATE UNIQUE INDEX "spells_name_key" ON "spells"("name");

-- CreateIndex
CREATE UNIQUE INDEX "spell_schools_name_key" ON "spell_schools"("name");

-- CreateIndex
CREATE UNIQUE INDEX "damage_types_name_key" ON "damage_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "conditions_name_key" ON "conditions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "creature_types_name_key" ON "creature_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "classes_name_key" ON "classes"("name");

-- CreateIndex
CREATE UNIQUE INDEX "species_name_key" ON "species"("name");

-- CreateIndex
CREATE UNIQUE INDEX "content_versions_version_key" ON "content_versions"("version");

-- AddForeignKey
ALTER TABLE "characters" ADD CONSTRAINT "characters_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "characters" ADD CONSTRAINT "characters_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_dm_id_fkey" FOREIGN KEY ("dm_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_version_history" ADD CONSTRAINT "character_version_history_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
