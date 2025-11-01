BEGIN;

-- Drop legacy content tables
DROP TABLE IF EXISTS "class_spells" CASCADE;
DROP TABLE IF EXISTS "class_feature_options" CASCADE;
DROP TABLE IF EXISTS "class_feature_choices" CASCADE;
DROP TABLE IF EXISTS "subclass_features" CASCADE;
DROP TABLE IF EXISTS "subclasses" CASCADE;
DROP TABLE IF EXISTS "fighting_styles" CASCADE;
DROP TABLE IF EXISTS "eldritch_invocations" CASCADE;
DROP TABLE IF EXISTS "divine_orders" CASCADE;
DROP TABLE IF EXISTS "feats" CASCADE;
DROP TABLE IF EXISTS "items" CASCADE;
DROP TABLE IF EXISTS "backgrounds" CASCADE;
DROP TABLE IF EXISTS "species" CASCADE;
DROP TABLE IF EXISTS "classes" CASCADE;
DROP TABLE IF EXISTS "spells" CASCADE;
DROP TABLE IF EXISTS "spell_schools" CASCADE;
DROP TABLE IF EXISTS "damage_types" CASCADE;
DROP TABLE IF EXISTS "conditions" CASCADE;
DROP TABLE IF EXISTS "creature_types" CASCADE;

-- Create logical schemas
CREATE SCHEMA IF NOT EXISTS raw;
CREATE SCHEMA IF NOT EXISTS canon;
CREATE SCHEMA IF NOT EXISTS ref;

-- Raw content storage
CREATE TABLE raw.content (
    id              BIGSERIAL PRIMARY KEY,
    kind            TEXT        NOT NULL,
    slug            TEXT        NOT NULL,
    source          TEXT        NOT NULL,
    title           TEXT        NOT NULL,
    raw             JSONB       NOT NULL,
    imported_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_homebrew     BOOLEAN     NOT NULL DEFAULT FALSE,
    CONSTRAINT raw_content_kind_chk CHECK (kind IN ('spell', 'item', 'class', 'species', 'background', 'feat')),
    CONSTRAINT raw_content_source_chk CHECK (source ~ '^(XPHB|XDMG|SRD|homebrew:.+)$'),
    CONSTRAINT raw_content_slug_source_unique UNIQUE (kind, slug, source)
);

CREATE INDEX raw_content_idx_kind ON raw.content (kind);
CREATE INDEX raw_content_idx_slug ON raw.content (slug);
CREATE INDEX raw_content_idx_source ON raw.content (source);

-- Reference tables
CREATE TABLE ref.spell_school (
    code        TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    description TEXT
);

CREATE TABLE ref.damage_type (
    slug        TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    description TEXT
);

CREATE TABLE ref.condition (
    slug        TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    description TEXT
);

CREATE TABLE ref.creature_type (
    slug        TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    description TEXT
);

-- Canonical spell tables
CREATE TABLE canon.spell (
    id                   BIGSERIAL PRIMARY KEY,
    raw_content_id       BIGINT      NOT NULL,
    slug                 TEXT        NOT NULL,
    name                 TEXT        NOT NULL,
    level                SMALLINT    NOT NULL,
    school_code          TEXT,
    casting_time         TEXT,
    spell_range          TEXT,
    components_verbal    BOOLEAN     NOT NULL DEFAULT FALSE,
    components_somatic   BOOLEAN     NOT NULL DEFAULT FALSE,
    components_material  TEXT,
    duration             TEXT,
    description          TEXT        NOT NULL,
    higher_level         TEXT,
    ritual               BOOLEAN     NOT NULL DEFAULT FALSE,
    concentration        BOOLEAN     NOT NULL DEFAULT FALSE,
    source               TEXT        NOT NULL,
    classes              TEXT[]      NOT NULL DEFAULT '{}',
    saving_throws        TEXT[]      NOT NULL DEFAULT '{}',
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT canon_spell_raw_fk FOREIGN KEY (raw_content_id) REFERENCES raw.content (id) ON DELETE CASCADE,
    CONSTRAINT canon_spell_school_fk FOREIGN KEY (school_code) REFERENCES ref.spell_school (code) ON DELETE SET NULL,
    CONSTRAINT canon_spell_slug_source_unique UNIQUE (slug, source)
);

CREATE INDEX canon_spell_idx_name ON canon.spell (name);
CREATE INDEX canon_spell_idx_level ON canon.spell (level);
CREATE INDEX canon_spell_idx_source ON canon.spell (source);
CREATE INDEX canon_spell_idx_school ON canon.spell (school_code);

CREATE TABLE canon.spell_damage_type (
    spell_id          BIGINT NOT NULL,
    damage_type_slug  TEXT   NOT NULL,
    CONSTRAINT canon_spell_damage_type_pk PRIMARY KEY (spell_id, damage_type_slug),
    CONSTRAINT canon_spell_damage_type_spell_fk FOREIGN KEY (spell_id) REFERENCES canon.spell (id) ON DELETE CASCADE,
    CONSTRAINT canon_spell_damage_type_ref_fk FOREIGN KEY (damage_type_slug) REFERENCES ref.damage_type (slug) ON DELETE CASCADE
);

CREATE TABLE canon.spell_condition (
    spell_id        BIGINT NOT NULL,
    condition_slug  TEXT   NOT NULL,
    CONSTRAINT canon_spell_condition_pk PRIMARY KEY (spell_id, condition_slug),
    CONSTRAINT canon_spell_condition_spell_fk FOREIGN KEY (spell_id) REFERENCES canon.spell (id) ON DELETE CASCADE,
    CONSTRAINT canon_spell_condition_ref_fk FOREIGN KEY (condition_slug) REFERENCES ref.condition (slug) ON DELETE CASCADE
);

-- CREATE TABLE canon.spell_class (
--    spell_id BIGINT NOT NULL,
--    class_id BIGINT NOT NULL,
--    CONSTRAINT canon_spell_class_pk PRIMARY KEY (spell_id, class_id),
--    CONSTRAINT canon_spell_class_spell_fk FOREIGN KEY (spell_id) REFERENCES canon.spell (id) ON DELETE CASCADE,
--    CONSTRAINT canon_spell_class_class_fk FOREIGN KEY (class_id) REFERENCES canon.class_definition (id) ON DELETE CASCADE
-- );

-- Canonical items
CREATE TABLE canon.item (
    id                   BIGSERIAL PRIMARY KEY,
    raw_content_id       BIGINT      NOT NULL,
    slug                 TEXT        NOT NULL,
    name                 TEXT        NOT NULL,
    item_type            TEXT,
    category             TEXT,
    rarity               TEXT,
    source               TEXT        NOT NULL,
    cost_value           INTEGER,
    cost_unit            TEXT,
    weight               NUMERIC,
    requires_attunement  BOOLEAN     NOT NULL DEFAULT FALSE,
    attunement_text      TEXT,
    weapon_category      TEXT,
    damage_dice          TEXT,
    damage_type_slug     TEXT,
    item_range           TEXT,
    armor_class          INTEGER,
    ac_bonus             INTEGER,
    properties           TEXT[]      NOT NULL DEFAULT '{}',
    description          TEXT        NOT NULL,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT canon_item_raw_fk FOREIGN KEY (raw_content_id) REFERENCES raw.content (id) ON DELETE CASCADE,
    CONSTRAINT canon_item_damage_fk FOREIGN KEY (damage_type_slug) REFERENCES ref.damage_type (slug) ON DELETE SET NULL,
    CONSTRAINT canon_item_slug_source_unique UNIQUE (slug, source)
);

CREATE INDEX canon_item_idx_name ON canon.item (name);
CREATE INDEX canon_item_idx_type ON canon.item (item_type);
CREATE INDEX canon_item_idx_source ON canon.item (source);

-- Canonical class data
CREATE TABLE canon.class_definition (
    id                     BIGSERIAL PRIMARY KEY,
    raw_content_id         BIGINT      NOT NULL,
    slug                   TEXT        NOT NULL,
    name                   TEXT        NOT NULL,
    source                 TEXT        NOT NULL,
    hit_die                SMALLINT,
    primary_abilities      TEXT[]      NOT NULL DEFAULT '{}',
    saving_throws          TEXT[]      NOT NULL DEFAULT '{}',
    armor_proficiencies    TEXT[]      NOT NULL DEFAULT '{}',
    weapon_proficiencies   TEXT[]      NOT NULL DEFAULT '{}',
    tool_proficiencies     TEXT[]      NOT NULL DEFAULT '{}',
    spellcasting_ability   TEXT,
    subclass_title         TEXT,
    summary                TEXT,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT canon_class_raw_fk FOREIGN KEY (raw_content_id) REFERENCES raw.content (id) ON DELETE CASCADE,
    CONSTRAINT canon_class_slug_source_unique UNIQUE (slug, source)
);

CREATE INDEX canon_class_idx_name ON canon.class_definition (name);
CREATE INDEX canon_class_idx_source ON canon.class_definition (source);

CREATE TABLE canon.class_feature (
    id           BIGSERIAL PRIMARY KEY,
    class_id     BIGINT   NOT NULL,
    level        SMALLINT NOT NULL,
    slug         TEXT     NOT NULL,
    name         TEXT     NOT NULL,
    description  TEXT     NOT NULL,
    source       TEXT     NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT canon_class_feature_class_fk FOREIGN KEY (class_id) REFERENCES canon.class_definition (id) ON DELETE CASCADE,
    CONSTRAINT canon_class_feature_slug_unique UNIQUE (class_id, slug)
);

CREATE INDEX canon_class_feature_idx_level ON canon.class_feature (class_id, level);

CREATE TABLE canon.subclass_definition (
    id             BIGSERIAL PRIMARY KEY,
    class_id       BIGINT NOT NULL,
    slug           TEXT   NOT NULL,
    name           TEXT   NOT NULL,
    source         TEXT   NOT NULL,
    summary        TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT canon_subclass_class_fk FOREIGN KEY (class_id) REFERENCES canon.class_definition (id) ON DELETE CASCADE,
    CONSTRAINT canon_subclass_slug_unique UNIQUE (class_id, slug)
);

CREATE TABLE canon.subclass_feature (
    id           BIGSERIAL PRIMARY KEY,
    subclass_id  BIGINT   NOT NULL,
    level        SMALLINT NOT NULL,
    slug         TEXT     NOT NULL,
    name         TEXT     NOT NULL,
    description  TEXT     NOT NULL,
    source       TEXT     NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT canon_subclass_feature_subclass_fk FOREIGN KEY (subclass_id) REFERENCES canon.subclass_definition (id) ON DELETE CASCADE,
    CONSTRAINT canon_subclass_feature_slug_unique UNIQUE (subclass_id, slug)
);

-- Canonical species data
CREATE TABLE canon.species_definition (
    id              BIGSERIAL PRIMARY KEY,
    raw_content_id  BIGINT      NOT NULL,
    slug            TEXT        NOT NULL,
    name            TEXT        NOT NULL,
    source          TEXT        NOT NULL,
    size            TEXT,
    speed_walk      SMALLINT,
    speed_other     TEXT,
    creature_type   TEXT,
    lifespan        TEXT,
    description     TEXT,
    languages       TEXT[]      NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT canon_species_raw_fk FOREIGN KEY (raw_content_id) REFERENCES raw.content (id) ON DELETE CASCADE,
    CONSTRAINT canon_species_creature_type_fk FOREIGN KEY (creature_type) REFERENCES ref.creature_type (slug) ON DELETE SET NULL,
    CONSTRAINT canon_species_slug_source_unique UNIQUE (slug, source)
);

CREATE TABLE canon.species_trait (
    id           BIGSERIAL PRIMARY KEY,
    species_id   BIGINT NOT NULL,
    slug         TEXT   NOT NULL,
    name         TEXT   NOT NULL,
    description  TEXT   NOT NULL,
    source       TEXT   NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT canon_species_trait_species_fk FOREIGN KEY (species_id) REFERENCES canon.species_definition (id) ON DELETE CASCADE,
    CONSTRAINT canon_species_trait_slug_unique UNIQUE (species_id, slug)
);

CREATE INDEX canon_species_idx_name ON canon.species_definition (name);
CREATE INDEX canon_species_idx_source ON canon.species_definition (source);

-- Canonical background data
CREATE TABLE canon.background_definition (
    id                   BIGSERIAL PRIMARY KEY,
    raw_content_id       BIGINT      NOT NULL,
    slug                 TEXT        NOT NULL,
    name                 TEXT        NOT NULL,
    source               TEXT        NOT NULL,
    description          TEXT,
    skill_proficiencies  TEXT[]      NOT NULL DEFAULT '{}',
    tool_proficiencies   TEXT[]      NOT NULL DEFAULT '{}',
    languages            TEXT[]      NOT NULL DEFAULT '{}',
    equipment            TEXT,
    feature_name         TEXT,
    feature_description  TEXT,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT canon_background_raw_fk FOREIGN KEY (raw_content_id) REFERENCES raw.content (id) ON DELETE CASCADE,
    CONSTRAINT canon_background_slug_source_unique UNIQUE (slug, source)
);

CREATE INDEX canon_background_idx_name ON canon.background_definition (name);
CREATE INDEX canon_background_idx_source ON canon.background_definition (source);

-- Canonical feat data
CREATE TABLE canon.feat_definition (
    id                      BIGSERIAL PRIMARY KEY,
    raw_content_id          BIGINT      NOT NULL,
    slug                    TEXT        NOT NULL,
    name                    TEXT        NOT NULL,
    source                  TEXT        NOT NULL,
    level_requirement       SMALLINT,
    prerequisite_summary    TEXT,
    repeatable              BOOLEAN     NOT NULL DEFAULT FALSE,
    ability_score_increase  TEXT,
    description             TEXT        NOT NULL,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT canon_feat_raw_fk FOREIGN KEY (raw_content_id) REFERENCES raw.content (id) ON DELETE CASCADE,
    CONSTRAINT canon_feat_slug_source_unique UNIQUE (slug, source)
);

CREATE INDEX canon_feat_idx_name ON canon.feat_definition (name);
CREATE INDEX canon_feat_idx_source ON canon.feat_definition (source);

-- Utility functions for data cleaning
CREATE OR REPLACE FUNCTION canon.clean_5etools_markup(input TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    result TEXT := input;
BEGIN
    IF result IS NULL THEN
        RETURN NULL;
    END IF;

    result := regexp_replace(result, '\{@damage ([^|}]+)(?:\|[^}]*)?\}', '\1', 'g');
    result := regexp_replace(result, '\{@dice ([^|}]+)(?:\|[^}]*)?\}', '\1', 'g');
    result := regexp_replace(result, '\{@spell ([^|}]+)(?:\|[^}]*)?\}', '\1', 'g');
    result := regexp_replace(result, '\{@item ([^|}]+)(?:\|[^}]*)?\}', '\1', 'g');
    result := regexp_replace(result, '\{@feat ([^|}]+)(?:\|[^}]*)?\}', '\1', 'g');
    result := regexp_replace(result, '\{@class ([^|}]+)(?:\|[^}]*)?\}', '\1', 'g');
    result := regexp_replace(result, '\{@condition ([^|}]+)(?:\|[^}]*)?\}', '\1', 'g');
    result := regexp_replace(result, '\{@creature ([^|}]+)(?:\|[^}]*)?\}', '\1', 'g');
    result := regexp_replace(result, '\{@link ([^|}]+)(?:\|[^}]*)?\}', '\1', 'g');
    result := regexp_replace(result, '\{@[a-zA-Z0-9_]+\|([^|}]+)(?:\|[^}]*)?\}', '\1', 'g');
    result := regexp_replace(result, '\{@[a-zA-Z0-9_]+ ([^|}]+)(?:\|[^}]*)?\}', '\1', 'g');
    result := regexp_replace(result, '\{@[^}]+\}', '', 'g');
    result := regexp_replace(result, '\s+', ' ', 'g');
    RETURN trim(result);
END;
$$;

CREATE OR REPLACE FUNCTION canon.flatten_time(value JSONB)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    element JSONB;
    parts   TEXT := '';
    piece   TEXT;
BEGIN
    IF value IS NULL OR jsonb_typeof(value) <> 'array' THEN
        RETURN NULL;
    END IF;

    FOR element IN SELECT * FROM jsonb_array_elements(value)
    LOOP
        piece := '';
        IF element ? 'number' THEN
            piece := piece || (element->>'number');
        END IF;
        IF element ? 'unit' THEN
            IF piece <> '' THEN
                piece := piece || ' ';
            END IF;
            piece := piece || (element->>'unit');
        END IF;
        IF element ? 'condition' THEN
            piece := piece || ' (' || canon.clean_5etools_markup(element->>'condition') || ')';
        END IF;
        IF parts <> '' THEN
            parts := parts || ', ';
        END IF;
        parts := parts || trim(piece);
    END LOOP;

    RETURN NULLIF(parts, '');
END;
$$;

CREATE OR REPLACE FUNCTION canon.flatten_range(value JSONB)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    distance JSONB;
    unit TEXT;
    amount TEXT;
    subtype TEXT;
BEGIN
    IF value IS NULL THEN
        RETURN NULL;
    END IF;

    IF (value->>'type') = 'self' THEN
        RETURN 'Self';
    ELSIF (value->>'type') = 'point' THEN
        distance := value->'distance';
        IF distance IS NULL THEN
            RETURN 'Point';
        END IF;
        unit := distance->>'type';
        amount := distance->>'amount';
        subtype := distance->>'note';
        RETURN trim(CONCAT_WS(' ', amount, unit, subtype));
    ELSIF (value->>'type') = 'radius' THEN
        distance := value->'distance';
        RETURN trim(CONCAT_WS(' ', distance->>'amount', distance->>'type', 'radius'));
    END IF;

    RETURN canon.clean_5etools_markup(value::TEXT);
END;
$$;

CREATE OR REPLACE FUNCTION canon.flatten_duration(value JSONB)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    element JSONB;
    segments TEXT := '';
    label TEXT;
BEGIN
    IF value IS NULL OR jsonb_typeof(value) <> 'array' THEN
        RETURN NULL;
    END IF;

    FOR element IN SELECT * FROM jsonb_array_elements(value)
    LOOP
        IF element ? 'type' AND element->>'type' = 'instant' THEN
            label := 'Instantaneous';
        ELSIF element ? 'type' AND element->>'type' = 'timed' THEN
            label := CONCAT_WS(' ', element#>>'{duration,amount}', element#>>'{duration,type}');
            IF (element->>'concentration')::BOOLEAN IS TRUE THEN
                label := label || ' (Concentration)';
            END IF;
        ELSE
            label := canon.clean_5etools_markup(element::TEXT);
        END IF;

        IF segments <> '' THEN
            segments := segments || ', ';
        END IF;
        segments := segments || label;
    END LOOP;

    RETURN segments;
END;
$$;

CREATE OR REPLACE FUNCTION canon.collect_entries(value JSONB)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    result TEXT := '';
    idx INT := 0;
    length INT;
    element JSONB;
    piece TEXT;
BEGIN
    IF value IS NULL THEN
        RETURN NULL;
    END IF;

    IF jsonb_typeof(value) = 'string' THEN
        RETURN canon.clean_5etools_markup(value::TEXT);
    ELSIF jsonb_typeof(value) = 'object' THEN
        IF value ? 'entries' THEN
            RETURN canon.collect_entries(value->'entries');
        ELSIF value ? 'caption' THEN
            RETURN canon.clean_5etools_markup(value->>'caption');
        ELSIF value ? 'name' THEN
            RETURN canon.clean_5etools_markup(value->>'name');
        ELSIF value ? 'text' THEN
            RETURN canon.clean_5etools_markup(value->>'text');
        ELSE
            RETURN canon.clean_5etools_markup(value::TEXT);
        END IF;
    ELSIF jsonb_typeof(value) = 'array' THEN
        length := jsonb_array_length(value);
        WHILE idx < length LOOP
            element := value->idx;
            piece := canon.collect_entries(element);
            IF piece IS NOT NULL AND piece <> '' THEN
                IF result <> '' THEN
                    result := result || E'\n';
                END IF;
                result := result || piece;
            END IF;
            idx := idx + 1;
        END LOOP;
        RETURN NULLIF(result, '');
    END IF;

    RETURN canon.clean_5etools_markup(value::TEXT);
END;
$$;

CREATE OR REPLACE FUNCTION canon.extract_spell(raw_doc JSONB)
RETURNS TABLE (
    level SMALLINT,
    school_code TEXT,
    casting_time TEXT,
    spell_range TEXT,
    components_verbal BOOLEAN,
    components_somatic BOOLEAN,
    components_material TEXT,
    duration TEXT,
    description TEXT,
    higher_level TEXT,
    ritual BOOLEAN,
    concentration BOOLEAN,
    saving_throws TEXT[]
)
LANGUAGE plpgsql
AS $$
DECLARE
    comps JSONB;
    saves TEXT[] := '{}';
BEGIN
    comps := raw_doc->'components';
    IF raw_doc ? 'savingThrow' THEN
        SELECT ARRAY(SELECT canon.clean_5etools_markup(value::TEXT) FROM jsonb_array_elements_text(raw_doc->'savingThrow'))
        INTO saves;
    END IF;

    RETURN QUERY SELECT
        COALESCE((raw_doc->>'level')::SMALLINT, 0::SMALLINT),
        raw_doc->>'school',
        canon.flatten_time(raw_doc->'time'),
        canon.flatten_range(raw_doc->'range'),
        COALESCE((comps->>'v')::BOOLEAN, FALSE),
        COALESCE((comps->>'s')::BOOLEAN, FALSE),
        canon.clean_5etools_markup(comps->>'m'),
        canon.flatten_duration(raw_doc->'duration'),
        canon.collect_entries(raw_doc->'entries'),
        canon.collect_entries(raw_doc->'entriesHigherLevel'),
        COALESCE((raw_doc->>'ritual')::BOOLEAN, FALSE),
        COALESCE((raw_doc->>'concentration')::BOOLEAN, FALSE),
        saves;
END;
$$;

COMMIT;
