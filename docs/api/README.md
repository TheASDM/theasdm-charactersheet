# API Documentation

The D&D Character Sheet Generator provides a comprehensive REST API with complete D&D 2024 content database and real-time WebSocket support (planned).

## 🎯 Current API Status

### ✅ Available Content

- **705 Items**: Complete item database from XPHB & XDMG sources
- **391 Spells**: Full D&D 2024 spell database with metadata
- **77 Feats**: General, epic, and fighting style feats
- **16 Backgrounds**: Character backgrounds with proficiencies
- **12 Classes**: All character classes with subclass details
- **10 Species**: Playable species with racial traits

### 🚧 In Development

- **RESTful API Endpoints**: Character and content management routes
- **Authentication System**: JWT-based user authentication
- **Real-time Features**: WebSocket integration for live updates

## Base URL

- **Development**: `http://localhost:3001/api` (planned)
- **Production**: `https://yourdomain.com/api` (planned)

## Authentication (Planned)

The API will use JWT (JSON Web Tokens) for authentication. Include the token in the `Authorization` header:

```http
Authorization: Bearer <your-jwt-token>
```

### Authentication Endpoints

#### POST `/auth/register`

Register a new user account.

```json
// Request
{
  "username": "string",
  "email": "string",
  "discordId": "string" // optional
}

// Response (201)
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "example",
      "email": "user@example.com",
      "isDm": false
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

#### POST `/auth/login`

Login with existing credentials.

```json
// Request
{
  "username": "string",
  "password": "string"
}

// Response (200)
{
  "success": true,
  "data": {
    "user": { /* user object */ },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

## Character Management

### GET `/characters`

List user's characters.

**Query Parameters:**

- `page` (number, default: 1)
- `limit` (number, default: 10)
- `campaignId` (number, optional)

```json
// Response (200)
{
  "success": true,
  "data": {
    "characters": [
      {
        "id": 1,
        "name": "Aragorn",
        "level": 5,
        "characterData": {
          /* character details */
        },
        "isPublic": true,
        "campaignId": 1,
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

### POST `/characters`

Create a new character.

```json
// Request
{
  "name": "string",
  "level": 1,
  "characterData": {
    "race": "Human",
    "class": "Fighter",
    "background": "Soldier",
    "abilityScores": {
      "strength": 16,
      "dexterity": 14,
      "constitution": 15,
      "intelligence": 12,
      "wisdom": 13,
      "charisma": 10
    },
    "hitPoints": {
      "maximum": 12,
      "current": 12,
      "temporary": 0
    },
    "armorClass": 16,
    "proficiencyBonus": 2,
    "skills": { /* skill proficiencies */ },
    "equipment": { /* equipment list */ },
    "spells": { /* spell list */ },
    "features": { /* class/race features */ }
  },
  "password": "string", // optional
  "isPublic": false,
  "campaignId": 1 // optional
}

// Response (201)
{
  "success": true,
  "data": {
    "character": { /* full character object */ }
  }
}
```

### GET `/characters/:id`

Get specific character details.

```json
// Response (200)
{
  "success": true,
  "data": {
    "character": {
      /* full character object */
    }
  }
}
```

### PUT `/characters/:id`

Update character information.

### DELETE `/characters/:id`

Delete a character.

### POST `/characters/:id/unlock`

Unlock password-protected character (DM override).

## D&D 2024 Content API

The API provides access to the complete D&D 2024 dataset with advanced filtering and search capabilities.

### GET `/spells`

Search and filter the 391 spell database.

**Query Parameters:**

- `search` (string) - Search spell names and descriptions
- `level` (number) - Filter by spell level (0-9)
- `school` (string) - Filter by spell school
- `class` (string) - Filter by casting class
- `ritual` (boolean) - Filter ritual spells
- `concentration` (boolean) - Filter concentration spells
- `page` (number, default: 1)
- `limit` (number, default: 20)

```json
// Response (200)
{
  "success": true,
  "data": {
    "spells": [
      {
        "id": 1,
        "name": "Fireball",
        "source": "XPHB",
        "level": 3,
        "school": "V",
        "time": [{ "number": 1, "unit": "action" }],
        "range": {
          "type": "point",
          "distance": { "type": "feet", "amount": 150 }
        },
        "components": {
          "v": true,
          "s": true,
          "m": "a tiny ball of bat guano and sulfur"
        },
        "duration": [{ "type": "instant" }],
        "entries": ["Spell description..."],
        "damageInflict": ["fire"],
        "savingThrow": ["dexterity"],
        "areaTags": ["S"],
        "damageResist": ["fire"],
        "miscTags": ["SGT"],
        "classes": {
          "fromClassList": [{ "name": "Sorcerer", "source": "XPHB" }]
        }
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 391, "pages": 20 }
  }
}
```

### GET `/items`

Search and filter the 705 item database.

**Query Parameters:**

- `search` (string) - Search item names and descriptions
- `type` (string) - Filter by item type (weapon, armor, etc.)
- `rarity` (string) - Filter by rarity (common, uncommon, rare, etc.)
- `source` (string) - Filter by source (XPHB, XDMG)
- `attunement` (boolean) - Filter items requiring attunement
- `magic` (boolean) - Filter magic items
- `page` (number, default: 1)
- `limit` (number, default: 20)

```json
// Response (200)
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "name": "Longsword",
        "source": "XPHB",
        "type": "M|XPHB",
        "rarity": "none",
        "weight": 3,
        "value": 1500,
        "dmg1": "1d8",
        "dmgType": "S",
        "weaponCategory": "martial",
        "property": ["V"],
        "entries": ["Item description..."],
        "sword": true,
        "weapon": true
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 705, "pages": 36 }
  }
}
```

### GET `/species`

List all 10 playable species.

```json
// Response (200)
{
  "success": true,
  "data": {
    "species": [
      {
        "id": 1,
        "name": "Human",
        "source": "XPHB",
        "size": ["M"],
        "speed": { "walk": 30 },
        "entries": ["Species description..."],
        "traitTags": ["Bonus Language", "Bonus Proficiency"]
      }
    ]
  }
}
```

### GET `/classes`

List all 12 character classes with subclass information.

### GET `/backgrounds`

List all 16 character backgrounds with skill proficiencies.

### GET `/feats`

Search and filter the 77 feat database.

**Query Parameters:**

- `search` (string) - Search feat names and descriptions
- `category` (string) - Filter by category (G, E, FS)
- `prerequisite` (string) - Filter by prerequisites

## Character Generation API

### GET `/generate/random`

Generate a random character using the complete D&D 2024 database.

```json
// Response (200)
{
  "success": true,
  "data": {
    "character": {
      "species": {
        /* species data */
      },
      "class": {
        /* class data */
      },
      "background": {
        /* background data */
      },
      "feat": {
        /* feat data */
      },
      "spells": [
        {
          /* 3 random spells */
        }
      ],
      "equipment": [
        {
          /* 3 random items */
        }
      ]
    },
    "summary": {
      "species": "Dragonborn",
      "class": "Cleric",
      "background": "Artisan",
      "feat": "Chef",
      "spellsKnown": 3,
      "equipmentItems": 3
    }
  }
}
```

### POST `/generate/manual`

Generate character with specific content IDs.

```json
// Request
{
  "spellIds": [1, 55, 203],
  "speciesId": 3,
  "itemIds": [42, 315, 526],
  "classId": 4,
  "subclassId": 2,
  "backgroundId": 6,
  "featId": 21
}
```

## Game Content API

### Spells

#### GET `/spells`

List all spells with filtering and search.

**Query Parameters:**

- `level` (number): Filter by spell level
- `school` (string): Filter by spell school
- `class` (string): Filter by class
- `search` (string): Full-text search
- `page` (number): Pagination
- `limit` (number): Results per page

```json
// Response (200)
{
  "success": true,
  "data": {
    "spells": [
      {
        "id": 1,
        "name": "Magic Missile",
        "level": 1,
        "school": "Evocation",
        "castingTime": "1 action",
        "rangeText": "120 feet",
        "duration": "Instantaneous",
        "components": {
          "V": true,
          "S": true,
          "M": false
        },
        "description": "You create three glowing darts...",
        "higherLevels": "When you cast this spell...",
        "classes": ["Wizard", "Sorcerer"],
        "sourceBook": "Player's Handbook 2024",
        "isHomebrew": false
      }
    ],
    "pagination": {
      /* pagination info */
    }
  }
}
```

#### GET `/spells/:id`

Get specific spell details.

### Classes

#### GET `/classes`

List all available classes.

```json
// Response (200)
{
  "success": true,
  "data": {
    "classes": [
      {
        "id": 1,
        "name": "Fighter",
        "hitDie": 10,
        "primaryAbility": ["Strength", "Dexterity"],
        "proficiencies": {
          "armor": ["light", "medium", "heavy", "shields"],
          "weapons": ["simple", "martial"],
          "savingThrows": ["Strength", "Constitution"]
        },
        "classFeatures": {
          "1": {
            "Second Wind": "Regain 1d10 + fighter level hit points"
          },
          "2": {
            "Action Surge": "Take an additional action on your turn"
          }
        },
        "spellCasting": null
      }
    ]
  }
}
```

### Races

#### GET `/races`

List all available races/species.

### Backgrounds

#### GET `/backgrounds`

List all available backgrounds.

### Items

#### GET `/items`

List items with filtering.

**Query Parameters:**

- `type` (string): weapon, armor, adventuring-gear, etc.
- `rarity` (string): common, uncommon, rare, etc.
- `search` (string): Full-text search

## Campaign Management

### GET `/campaigns`

List campaigns (user must be DM or member).

### POST `/campaigns`

Create a new campaign (DM only).

### PUT `/campaigns/:id`

Update campaign (DM only).

### POST `/campaigns/:id/invite`

Invite player to campaign (DM only).

## Real-time WebSocket API

Connect to WebSocket at `/socket.io/` for real-time updates.

### Events

#### Client to Server

```javascript
// Join character room for updates
socket.emit('join-character', characterId);

// Send character update
socket.emit('character-update', {
  characterId: 1,
  updateType: 'hit-points',
  data: { current: 8 },
});

// Leave character room
socket.emit('leave-character', characterId);
```

#### Server to Client

```javascript
// Character updated by another user
socket.on('character-updated', (data) => {
  console.log('Character updated:', data);
});

// Campaign event
socket.on('campaign-event', (data) => {
  console.log('Campaign event:', data);
});
```

## Error Handling

All API responses follow a consistent format:

### Success Response

```json
{
  "success": true,
  "data": {
    /* response data */
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": {
      /* additional error info */
    }
  }
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Validation Error
- `429` - Rate Limited
- `500` - Internal Server Error

### Common Error Codes

- `VALIDATION_ERROR` - Request validation failed
- `AUTHENTICATION_REQUIRED` - No valid token provided
- `INSUFFICIENT_PERMISSIONS` - User lacks required permissions
- `CHARACTER_NOT_FOUND` - Character doesn't exist or access denied
- `CHARACTER_LOCKED` - Character is password protected
- `RATE_LIMIT_EXCEEDED` - Too many requests

## Rate Limiting

API endpoints are rate limited:

- **General API**: 100 requests per 15 minutes per IP
- **Authentication**: 5 requests per minute per IP
- **Character Updates**: 60 requests per minute per user

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Data Import/Export

### POST `/characters/:id/export`

Export character data as JSON or PDF.

### POST `/import/csv`

Import game content from CSV files (DM only).

**Supported content types:**

- Spells
- Items
- Classes
- Races
- Backgrounds

## Webhooks

Register webhooks for external integrations:

### POST `/webhooks`

Register a webhook endpoint.

### Webhook Events

- `character.created`
- `character.updated`
- `character.deleted`
- `campaign.created`
- `user.registered`

## SDK and Examples

### JavaScript/Node.js Example

```javascript
const API_BASE = 'http://localhost:3001/api';
let authToken = null;

// Login
async function login(username, password) {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });

  const data = await response.json();
  if (data.success) {
    authToken = data.data.token;
    return data.data.user;
  }
  throw new Error(data.error.message);
}

// Get characters
async function getCharacters() {
  const response = await fetch(`${API_BASE}/characters`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  const data = await response.json();
  return data.success ? data.data.characters : [];
}

// Create character
async function createCharacter(characterData) {
  const response = await fetch(`${API_BASE}/characters`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(characterData),
  });

  const data = await response.json();
  if (data.success) {
    return data.data.character;
  }
  throw new Error(data.error.message);
}
```

### Python Example

```python
import requests

class DNDCharacterAPI:
    def __init__(self, base_url):
        self.base_url = base_url
        self.token = None

    def login(self, username, password):
        response = requests.post(f"{self.base_url}/auth/login",
                               json={"username": username, "password": password})
        data = response.json()

        if data["success"]:
            self.token = data["data"]["token"]
            return data["data"]["user"]
        else:
            raise Exception(data["error"]["message"])

    def get_characters(self):
        headers = {"Authorization": f"Bearer {self.token}"}
        response = requests.get(f"{self.base_url}/characters", headers=headers)
        data = response.json()

        return data["data"]["characters"] if data["success"] else []

# Usage
api = DNDCharacterAPI("http://localhost:3001/api")
api.login("username", "password")
characters = api.get_characters()
```

For more examples and integration guides, see our [GitHub repository](https://github.com/your-repo).
