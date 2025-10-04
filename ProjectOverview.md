## Project Overview

This document provides complete technical specifications for building a web-based D&D 2024 character sheet generator incorporating Nimble TTRPG homebrew mechanics, designed for homelab deployment supporting up to 15 users with PostgreSQL backend, Discord integration, and advanced character management features.

## Core System Requirements

### Functional Requirements

- **D&D 2024 compliant character creation** with full rule support
- **Homebrew integration** featuring some Nimble TTRPG mechanics (streamlined actions, mana system, wound system) [Short Rest Studios +2](https://shortreststudios.com/nimble-rpg/)
- **Character password protection** with DM override capabilities
- **Discord bot integration** for character lookup, dice rolling, and spell reference
- **CSV data import** for game content with version control
- **Real-time character updates** and campaign sharing
- **Mobile-responsive design** optimized for tablet gameplay
- **Accessibility compliance** with WCAG 2.1 AA standards

### Technical Requirements

- **PostgreSQL database** with JSON hybrid schema
- **Node.js/Express backend** with TypeScript
- **React frontend** with progressive web app capabilities
- **Discord.js bot framework** with slash command support
- **Automated backup system** with version control
- **SSL/TLS encryption** with Let's Encrypt integration

## Database Architecture

### Core Schema Design

sql

```sql
-- Users and Authentication
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    discord_id BIGINT UNIQUE,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    is_dm BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Character Management
CREATE TABLE characters (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    name VARCHAR(100) NOT NULL,
    level INTEGER DEFAULT 1,
    character_data JSONB NOT NULL,
    password_hash VARCHAR(255),
    is_public BOOLEAN DEFAULT FALSE,
    campaign_id INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Game Content (D&D 2024 + Homebrew)
CREATE TABLE spells (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    level INTEGER NOT NULL,
    school VARCHAR(50),
    casting_time VARCHAR(100),
    range_text VARCHAR(100),
    duration VARCHAR(100),
    components JSONB,
    description TEXT,
    higher_levels TEXT,
    classes TEXT[],
    source_book VARCHAR(100),
    content_version VARCHAR(20),
    is_homebrew BOOLEAN DEFAULT FALSE
);

CREATE TABLE classes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    hit_die INTEGER,
    primary_ability TEXT[],
    proficiencies JSONB,
    class_features JSONB,
    spell_casting JSONB,
    content_version VARCHAR(20)
);

-- Version Control and Migrations
CREATE TABLE content_versions (
    id SERIAL PRIMARY KEY,
    version VARCHAR(20) NOT NULL,
    release_date TIMESTAMP,
    description TEXT,
    breaking_changes BOOLEAN DEFAULT FALSE,
    migration_scripts JSONB
);

CREATE TABLE character_version_history (
    id SERIAL PRIMARY KEY,
    character_id INTEGER REFERENCES characters(id),
    version_applied VARCHAR(20),
    applied_at TIMESTAMP DEFAULT NOW(),
    migration_notes TEXT
);
```

### Key Design Patterns

- **JSONB for flexibility**: Character data stored as flexible JSON with indexed frequently-queried fields
- **Normalized content tables**: Spells, items, classes in structured tables for efficient queries
- **Version control**: Track content versions and character migrations
- **Audit trails**: Complete history of character changes with attribution

## D&D 2024 Rule Implementation

### Critical Changes to Support

**Character Creation Flow:**

- **Background-driven ability scores** (+2/+1 or +1/+1/+1 from backgrounds) [D&D Beyond +2](https://www.dndbeyond.com/posts/1745-whats-new-in-the-2024-players-handbook)
- **Origin Feats** granted by backgrounds during creation [D&D Beyond](https://www.dndbeyond.com/posts/1745-whats-new-in-the-2024-players-handbook)[Dungeons and Dragons Fan](https://dungeonsanddragonsfan.com/new-2024-dnd-feats/)
- **Species terminology** replacing "race" throughout system [Dungeons and Dragons Fan](https://dungeonsanddragonsfan.com/dnd-2024-changes/)[LitRPG Reads](https://litrpgreads.com/blog/rpg/one-dnd-2024-core-rules-vs-2014-full-breakdown-of-class-spell-and-system-changes)
- **Level 3 subclasses** standardized across all classes [StartPlaying +4](https://startplaying.games/blog/posts/how-to-change-dnd-character-sheet-2024-rules-dd-beyond)

**Spell System Updates:**

- **185+ modified spells** requiring updated descriptions [Stack Exchange](https://rpg.stackexchange.com/questions/213514/which-spells-changed-between-the-2014-and-2024-edition-of-5e)
- **New spell mechanics** (True Strike rework, Polymorph HP changes) [Wargamer](https://www.wargamer.com/dnd/changes-to-spells-2024-players-handbook)
- **Emanation area effects** as new spell type [D&D Beyond](https://www.dndbeyond.com/posts/1762-4-key-changes-to-spells-in-the-2024-players)
- **Class-specific spell lists** moved to class descriptions [D&D Beyond](https://www.dndbeyond.com/posts/1762-4-key-changes-to-spells-in-the-2024-players)

**Combat Mechanics:**

- **Weapon Mastery properties** for martial classes [D&D Beyond](https://www.dndbeyond.com/posts/1745-whats-new-in-the-2024-players-handbook)[D&D Beyond](https://www.dndbeyond.com/posts/1742-your-guide-to-weapon-mastery-in-the-2024-players)
- **New actions**: Study, Influence, Utilize [Dungeonsports](https://www.dungeonsports.com/2024-dd-basic-rules/)[GamesRadar+](https://www.gamesradar.com/tabletop-gaming/dnd-2024-differences-changes-dungeons-and-dragons-5e/)
- **Exhaustion rework**: Scaling penalties instead of escalating effects [Dice Dungeons](https://dicedungeons.com/blogs/inside/quick-reference-dnd-2024-rule-changes)
- **Epic Boons** at level 19+ allowing stats up to 30 [Dungeons and Dragons Fan](https://dungeonsanddragonsfan.com/epic-boons-dnd-2024-guide/)

## Homebrew Integration: Nimble TTRPG Mechanics

### Streamlined Actions System

javascript

```javascript
// Heroic Actions: 3 flexible actions per turn with D&D attack/damage
const characterActions = {
    heroicActions: 3,
    availableActions: ['attack', 'cast', 'move', 'hide', 'dash', 'help', 'grapple', 'study', 'utilize'],
    reactions: ['interpose', 'opportunity_attack', 'help', 'assess']
};

// Normal D&D attack rolls with Rushed penalties
function makeAttack(attackBonus, hostileActionsUsed = 0) {
    let rollAdvantage = 'normal';
    
    // Apply Rushed penalties for multiple hostile actions
    if (hostileActionsUsed === 1) {
        rollAdvantage = 'disadvantage';
    } else if (hostileActionsUsed >= 2) {
        rollAdvantage = 'double_disadvantage'; // Roll 3d20, take lowest
    }
    
    const attackRoll = rollD20(rollAdvantage) + attackBonus;
    return { attackRoll, rollAdvantage };
}

// Standard D&D damage roll (no exploding crits)
function rollDamage(weapon) {
    return rollDice(weapon.damageDie) + weapon.damageBonus;
}

// Track hostile actions for Rushed penalties
function trackHostileActions(actionsUsed) {
    return actionsUsed.filter(action => 
        ['attack', 'cast_offensive_spell'].includes(action)
    ).length;
}
```

### Mana System Implementation

javascript

```javascript
// Replace spell slots with mana points
function calculateMana(character) {
    const { classes, level } = character;
    let totalMana = 0;
    
    classes.forEach(charClass => {
        if (charClass.spellcasting === 'full') {
            totalMana += getSpellSlotTotal(charClass.level) + charClass.level;
        } else if (charClass.spellcasting === 'half') {
            totalMana += getHalfCasterMana(charClass.level);
        }
    });
    
    return totalMana;
}

// Spell casting with mana cost
function castSpell(spell, character, upcastLevel = spell.level) {
    const manaCost = upcastLevel;
    if (character.currentMana < manaCost) {
        throw new Error('Insufficient mana');
    }
    
    character.currentMana -= manaCost;
    return executeSpell(spell, upcastLevel);
}
```

### Wound System (Death Save Replacement)

javascript

```javascript
// Exhaustion-based dying system
function handleDamageToZeroHP(character, damage) {
    character.hp = 0;
    character.conditions.push('dying');
    
    // Add exhaustion level instead of death save
    addExhaustion(character, 1);
    
    if (character.exhaustionLevel >= 6) {
        character.status = 'dead';
    }
}

function addExhaustion(character, levels = 1) {
    character.exhaustionLevel += levels;
    // Apply -1 penalty to all d20 rolls per exhaustion level
    character.modifiers.allRolls = -character.exhaustionLevel;
}
```

## Technical Stack Implementation

### Backend Architecture (Node.js/Express/TypeScript)

typescript

```typescript
// Main application structure
import express from 'express';
import { PrismaClient } from '@prisma/client';
import helmet from 'helmet';
import cors from 'cors';

const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Character management routes
app.get('/api/characters/:id', authenticateUser, async (req, res) => {
    const character = await getCharacterWithPermissions(req.params.id, req.user);
    res.json(character);
});

app.put('/api/characters/:id', authenticateUser, validateCharacterData, async (req, res) => {
    const updatedCharacter = await updateCharacter(req.params.id, req.body, req.user);
    res.json(updatedCharacter);
});

// Spell and content API
app.get('/api/spells', async (req, res) => {
    const spells = await prisma.spell.findMany({
        where: {
            contentVersion: req.query.version || 'latest'
        }
    });
    res.json(spells);
});
```

### Frontend Architecture (React/TypeScript)

tsx

```tsx
// Character creation workflow component
import React, { useState } from 'react';
import { CharacterWizard } from './components/CharacterWizard';
import { CharacterSheet } from './components/CharacterSheet';

interface Character {
    id?: string;
    name: string;
    species: string;
    background: string;
    classes: CharacterClass[];
    abilityScores: AbilityScores;
    manaPool?: number; // Nimble homebrew
    heroicActions?: number; // Nimble homebrew
}

export const CharacterCreator: React.FC = () => {
    const [character, setCharacter] = useState<Character>();
    const [creationMode, setCreationMode] = useState<'guided' | 'quick' | 'advanced'>('guided');

    return (
        <div className="character-creator">
            {!character ? (
                <CharacterWizard
                    mode={creationMode}
                    onComplete={setCharacter}
                    homebrew={{ 
                        nimbleActions: true, 
                        manaSystem: true, 
                        woundSystem: true 
                    }}
                />
            ) : (
                <CharacterSheet 
                    character={character}
                    onUpdate={setCharacter}
                    homebrew={true}
                />
            )}
        </div>
    );
};
```

### Database Integration (Prisma ORM)

typescript

```typescript
// schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Character {
  id           Int      @id @default(autoincrement())
  userId       Int      @map("user_id")
  name         String   @db.VarChar(100)
  level        Int      @default(1)
  characterData Json    @map("character_data")
  passwordHash String?  @map("password_hash") @db.VarChar(255)
  isPublic     Boolean  @default(false) @map("is_public")
  campaignId   Int?     @map("campaign_id")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")
  
  user         User     @relation(fields: [userId], references: [id])
  campaign     Campaign? @relation(fields: [campaignId], references: [id])
  
  @@map("characters")
}
```

## Discord Bot Integration

### Bot Architecture (Discord.js)

javascript

```javascript
// Discord bot with character integration
const { Client, GatewayIntentBits, SlashCommandBuilder } = require('discord.js');
const { PrismaClient } = require('@prisma/client');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

const prisma = new PrismaClient();

// Character lookup command
const characterCommand = new SlashCommandBuilder()
    .setName('character')
    .setDescription('Display your character sheet')
    .addStringOption(option =>
        option.setName('name')
            .setDescription('Character name')
            .setRequired(false));

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    
    if (interaction.commandName === 'character') {
        const characterName = interaction.options.getString('name');
        const character = await getDiscordUserCharacter(interaction.user.id, characterName);
        
        if (!character) {
            await interaction.reply('Character not found. Use `/link` to connect your character sheet.');
            return;
        }
        
        const embed = createCharacterEmbed(character);
        await interaction.reply({ embeds: [embed] });
    }
});

// Dice rolling with character modifiers
const rollCommand = new SlashCommandBuilder()
    .setName('roll')
    .setDescription('Roll dice with character modifiers')
    .addStringOption(option =>
        option.setName('type')
            .setDescription('Type of roll')
            .setRequired(true)
            .addChoices(
                { name: 'Attack', value: 'attack' },
                { name: 'Skill Check', value: 'skill' },
                { name: 'Saving Throw', value: 'save' }
            ));

// Character linking system
async function linkCharacter(discordUserId, characterId, password) {
    const character = await prisma.character.findUnique({
        where: { id: characterId }
    });
    
    if (!character) throw new Error('Character not found');
    
    if (character.passwordHash && !await bcrypt.compare(password, character.passwordHash)) {
        throw new Error('Invalid password');
    }
    
    // Create Discord-Character link
    await prisma.discordCharacterLink.create({
        data: {
            discordUserId,
            characterId
        }
    });
}
```

### Authentication and Permissions

javascript

```javascript
// Permission system for character access
async function checkCharacterAccess(discordUserId, characterId, action = 'read') {
    const character = await prisma.character.findUnique({
        where: { id: characterId },
        include: { user: true }
    });
    
    // Owner access
    const userLink = await prisma.discordCharacterLink.findFirst({
        where: { discordUserId, characterId }
    });
    if (userLink) return true;
    
    // DM override in current guild
    const guild = await getCurrentGuild();
    const member = await guild.members.fetch(discordUserId);
    
    if (member.permissions.has('MANAGE_GUILD') || member.roles.cache.some(role => role.name.toLowerCase().includes('dm'))) {
        await logDMAccess(discordUserId, characterId, action);
        return true;
    }
    
    // Public character access
    if (character.isPublic && action === 'read') {
        return true;
    }
    
    return false;
}
```

## User Experience Design

### Character Creation Workflow

**Guided Creation (New Users):**

1. **Character Concept** - Species, background, class selection with tooltips
2. **Ability Scores** - Background-driven allocation with visual feedback
3. **Features & Equipment** - Automated feature grants and starting equipment
4. **Personalization** - Name, appearance, backstory with optional fields
5. **Review & Confirm** - Final validation with rule conflict resolution

**Quick Creation (Experienced Users):**

- Single-page form with all essential choices
- Auto-calculation of derived stats
- Template-based starting points
- Skip optional personalization

**Advanced Mode (Power Users):**

- Direct JSON editing with validation
- Homebrew content integration
- Rule override capabilities
- Bulk character import/export

### Responsive Design Patterns

scss

```scss
// Mobile-first responsive design
.character-sheet {
    display: grid;
    gap: 1rem;
    
    // Mobile: Single column
    grid-template-columns: 1fr;
    
    // Tablet: Two columns
    @media (min-width: 768px) {
        grid-template-columns: 1fr 1fr;
    }
    
    // Desktop: Three columns with sidebar
    @media (min-width: 1024px) {
        grid-template-columns: 250px 1fr 1fr;
    }
}

// Touch-friendly interfaces
.action-button {
    min-height: 44px;
    min-width: 44px;
    font-size: 1.1rem;
    border-radius: 8px;
    
    @media (hover: hover) {
        &:hover {
            background-color: var(--primary-hover);
        }
    }
}
```

### Accessibility Implementation

tsx

```tsx
// Accessible form components
export const AccessibleInput: React.FC<InputProps> = ({ 
    label, 
    error, 
    required, 
    ...props 
}) => {
    const inputId = useId();
    const errorId = `${inputId}-error`;
    
    return (
        <div className="form-group">
            <label htmlFor={inputId} className="form-label">
                {label}
                {required && <span aria-label="required" className="required-indicator">*</span>}
            </label>
            <input
                {...props}
                id={inputId}
                className={`form-input ${error ? 'form-input--error' : ''}`}
                aria-describedby={error ? errorId : undefined}
                aria-invalid={!!error}
            />
            {error && (
                <div id={errorId} className="form-error" role="alert">
                    {error}
                </div>
            )}
        </div>
    );
};
```

## Data Management and Version Control

### CSV Import System

javascript

```javascript
// Content import pipeline
async function importGameContent(csvFile, contentType) {
    const validator = getValidator(contentType);
    const data = await parseCSV(csvFile);
    
    // Validation stage
    const validationResults = data.map(row => validator.validate(row));
    const errors = validationResults.filter(result => !result.valid);
    
    if (errors.length > 0) {
        throw new ImportError('Validation failed', errors);
    }
    
    // Transformation stage
    const transformedData = data.map(row => transformForDatabase(row, contentType));
    
    // Loading stage (transactional)
    await prisma.$transaction(async (prisma) => {
        for (const item of transformedData) {
            await prisma[contentType].upsert({
                where: { name: item.name },
                update: item,
                create: item
            });
        }
    });
    
    // Version tracking
    await prisma.contentVersion.create({
        data: {
            version: generateVersion(),
            description: `Imported ${data.length} ${contentType} items`,
            affectedEntities: [contentType]
        }
    });
}
```

### Version Control and Migration System

javascript

```javascript
// Character data migration system
class CharacterMigrationManager {
    async migrateCharacter(characterId, targetVersion) {
        const character = await prisma.character.findUnique({
            where: { id: characterId },
            include: { versionHistory: true }
        });
        
        const currentVersion = character.versionHistory[0]?.version || '1.0.0';
        const migrationPath = this.getMigrationPath(currentVersion, targetVersion);
        
        let characterData = character.characterData;
        
        for (const migration of migrationPath) {
            characterData = await migration.execute(characterData);
            
            await prisma.characterVersionHistory.create({
                data: {
                    characterId,
                    version: migration.version,
                    migrationNotes: migration.description
                }
            });
        }
        
        await prisma.character.update({
            where: { id: characterId },
            data: { 
                characterData,
                updatedAt: new Date()
            }
        });
    }
    
    getMigrationPath(fromVersion, toVersion) {
        // Return ordered list of migrations needed
        return this.migrations.filter(migration => 
            this.isVersionBetween(migration.version, fromVersion, toVersion)
        ).sort((a, b) => this.compareVersions(a.version, b.version));
    }
}
```

[Stack Overflow +3](https://stackoverflow.com/questions/57611587/rolling-back-backwards-incompatible-database-migrations)

## Performance and Monitoring

### Database Optimization

sql

```sql
-- Essential indexes for character sheet performance
CREATE INDEX idx_characters_user_id ON characters(user_id);
CREATE INDEX idx_characters_campaign_id ON characters(campaign_id);
CREATE INDEX idx_characters_name_search ON characters USING gin(to_tsvector('english', name));
CREATE INDEX idx_character_data_level ON characters USING gin((character_data->>'level'));

-- Spell search optimization
CREATE INDEX idx_spells_name_class ON spells(name, classes);
CREATE INDEX idx_spells_level_school ON spells(level, school);
CREATE INDEX idx_spells_content_version ON spells(content_version) WHERE is_homebrew = false;

-- Performance monitoring queries
SELECT 
    schemaname, 
    tablename, 
    attname, 
    n_distinct, 
    correlation 
FROM pg_stats 
WHERE schemaname = 'public' 
AND tablename IN ('characters', 'spells', 'classes');
```

### Application Monitoring

javascript

```javascript
// Performance monitoring middleware
const prometheus = require('prom-client');

// Custom metrics
const characterCreationTime = new prometheus.Histogram({
    name: 'character_creation_duration_seconds',
    help: 'Time taken to create a character',
    labelNames: ['creation_type']
});

const activeUsers = new prometheus.Gauge({
    name: 'active_users_total',
    help: 'Number of active users'
});

// Middleware to track response times
app.use((req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
        const duration = (Date.now() - start) / 1000;
        
        if (req.path.includes('/characters')) {
            characterCreationTime
                .labels(req.method === 'POST' ? 'new' : 'edit')
                .observe(duration);
        }
    });
    
    next();
});
```
