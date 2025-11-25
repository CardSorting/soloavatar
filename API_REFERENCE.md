# API Reference - Single-User Avatar Drop System

Complete API documentation for all endpoints.

---

## Base URL

All APIs are prefixed with `/api`

---

## Collections

### List Collections
```http
GET /api/collections?q=search
```

**Query Parameters:**
- `q` (optional): Search query

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Collection Name",
    "description": "Description",
    "color": "#FF5733",
    "coverImageUrl": "url",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z",
    "avatarCount": 10
  }
]
```

### Create Collection
```http
POST /api/collections
Content-Type: application/json

{
  "name": "Collection Name",
  "description": "Optional description",
  "color": "#FF5733",
  "coverImageUrl": "url"
}
```

### Get Collection
```http
GET /api/collections/[id]
```

### Update Collection
```http
PATCH /api/collections/[id]
Content-Type: application/json

{
  "name": "New Name",
  "description": "New Description",
  "color": "#FF5733",
  "coverImageUrl": "url"
}
```

### Delete Collection
```http
DELETE /api/collections/[id]
```

### Add Items to Collection
```http
POST /api/collections/[id]/items
Content-Type: application/json

{
  "avatarIds": ["uuid1", "uuid2"]
}
```

### Remove Items from Collection
```http
DELETE /api/collections/[id]/items
Content-Type: application/json

{
  "avatarIds": ["uuid1", "uuid2"]
}
```

---

## Avatars

### Generate Avatar
```http
POST /api/avatars/generate
Content-Type: application/json

{
  "imageBase64": "data:image/jpeg;base64,...",
  "stylePrompt": "cyberpunk style",
  "userId": "single-user" // optional
}
```

**Response:**
```json
{
  "success": true,
  "requestId": "uuid",
  "jobId": "uuid",
  "status": "pending",
  "message": "Avatar generation started..."
}
```

### Get Avatar
```http
GET /api/avatars/[id]
```

### Update Avatar Metadata
```http
PATCH /api/avatars/[id]
Content-Type: application/json

{
  "tags": ["tag1", "tag2"],
  "favorite": true,
  "rating": 5,
  "notes": "My notes",
  "collectionId": "uuid" // or null to remove
}
```

### Batch Generate Avatars
```http
POST /api/avatars/batch-generate
Content-Type: application/json

{
  "imageBase64": "data:image/jpeg;base64,...",
  "stylePrompts": ["cyberpunk", "anime", "watercolor"],
  "userId": "single-user" // optional
}
```

**Response:**
```json
{
  "success": true,
  "requests": [
    {
      "id": "uuid",
      "stylePrompt": "cyberpunk",
      "status": "pending"
    }
  ],
  "jobIds": ["uuid1", "uuid2"],
  "message": "Batch generation started..."
}
```

### Regenerate Avatar
```http
POST /api/avatars/[id]/regenerate
Content-Type: application/json

{
  "stylePrompt": "new style", // optional, uses existing if not provided
  "userId": "single-user" // optional
}
```

### Get User Avatars
```http
GET /api/avatars/user/[userId]
```

---

## Drops

### Create Drop
```http
POST /api/drops
Content-Type: application/json

{
  "baseAvatarId": "uuid",
  "title": "My Drop",
  "description": "Description",
  "stockLimit": 50,
  "collectionName": "Collection",
  "traitConfig": {
    "categories": [
      {
        "name": "Background",
        "values": ["Solid", "Gradient"]
      }
    ]
  }
}
```

### List Drops
```http
GET /api/drops?limit=50
```

### Get Drop
```http
GET /api/drops/[id]
```

### Delete Drop
```http
DELETE /api/drops/[id]
```

### Get Drop Variations
```http
GET /api/drops/[id]/variations?rarity=rare&assigned=false&limit=20&offset=0
```

**Query Parameters:**
- `rarity` (optional): Filter by rarity
- `assigned` (optional): `true` or `false`
- `limit` (optional): Default 50
- `offset` (optional): Default 0

**Response:**
```json
{
  "variations": [
    {
      "id": "uuid",
      "tokenNumber": 1,
      "traits": [
        {"trait_type": "Background", "value": "Gradient"}
      ],
      "rarity": "rare",
      "rarityScore": 0.6,
      "avatarImageUrl": "url",
      "assignedToken": null
    }
  ],
  "pagination": {
    "total": 50,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

### Get Generation Status
```http
GET /api/drops/[id]/generation-status
```

**Response:**
```json
{
  "dropId": "uuid",
  "generationStatus": "completed",
  "generationProgress": 100,
  "totalVariations": 50,
  "stockLimit": 50,
  "assignedCount": 10,
  "unassignedCount": 40,
  "rarityDistribution": {
    "common": 25,
    "uncommon": 15,
    "rare": 7,
    "epic": 2,
    "legendary": 1
  }
}
```

### Claim Variation
```http
POST /api/drops/[id]/claim
Content-Type: application/json

{
  "tokenNumber": 1
}
```

**Response:**
```json
{
  "success": true,
  "ownership": {
    "id": "uuid",
    "tokenNumber": 1,
    "acquiredAt": "2024-01-01T00:00:00Z"
  },
  "variation": {
    "id": "uuid",
    "traits": [...],
    "rarity": "rare",
    "avatarImageUrl": "url"
  }
}
```

---

## Gallery

### Get Gallery
```http
GET /api/gallery/[userId]?type=all&collectionId=uuid&tags=tag1,tag2&favorite=true&status=completed&search=query&sortBy=createdAt&sortOrder=desc&limit=50&offset=0
```

**Query Parameters:**
- `type`: `avatar`, `drop`, or `all` (default: `all`)
- `collectionId`: Filter by collection
- `tags`: Comma-separated tags
- `favorite`: `true` or `false`
- `status`: Filter avatars by status
- `search`: Search query
- `sortBy`: `createdAt`, `updatedAt`, `rating`, or `title`
- `sortOrder`: `asc` or `desc` (default: `desc`)
- `limit`: Default 50
- `offset`: Default 0

**Response:**
```json
{
  "userId": "single-user",
  "items": [
    {
      "type": "avatar",
      "id": "uuid",
      "imageUrl": "url",
      "title": "Avatar - style...",
      "status": "completed",
      "tags": ["tag1"],
      "favorite": true,
      "rating": 5,
      "collectionId": "uuid",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "total": 100,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  },
  "stats": {
    "avatars": 60,
    "drops": 40,
    "total": 100
  },
  "filters": {
    "type": "all",
    "collectionId": "uuid",
    "tags": ["tag1", "tag2"],
    "favorite": true,
    "status": "completed",
    "search": "query",
    "sortBy": "createdAt",
    "sortOrder": "desc"
  }
}
```

---

## Search

### Search
```http
GET /api/search?q=query&type=all&limit=20&offset=0
```

**Query Parameters:**
- `q` (required): Search query
- `type`: `avatar`, `drop`, `collection`, or `all` (default: `all`)
- `limit`: Default 20
- `offset`: Default 0

**Response:**
```json
{
  "query": "search term",
  "results": [
    {
      "type": "avatar",
      "id": "uuid",
      "title": "Avatar - style...",
      "imageUrl": "url",
      "matchScore": 15
    }
  ],
  "pagination": {
    "total": 50,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  },
  "counts": {
    "avatars": 30,
    "drops": 15,
    "collections": 5,
    "total": 50
  }
}
```

---

## Statistics

### Get Statistics
```http
GET /api/stats?quick=false
```

**Query Parameters:**
- `quick`: `true` for lightweight stats (default: `false`)

**Response:**
```json
{
  "totalAvatars": 100,
  "totalDrops": 20,
  "totalVariations": 500,
  "totalFavorites": 15,
  "averageRating": 4.2,
  "rarityDistribution": {
    "common": 250,
    "uncommon": 150,
    "rare": 75,
    "epic": 20,
    "legendary": 5
  },
  "topTags": [
    {"tag": "cyberpunk", "count": 25},
    {"tag": "anime", "count": 20}
  ],
  "storageUsed": 50000000,
  "collectionsCount": 5,
  "completedAvatars": 95,
  "pendingAvatars": 3,
  "failedAvatars": 2,
  "timestamp": "2024-01-01T00:00:00Z"
}
```

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "error": "Error message"
}
```

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

## Authentication

Currently, the system is single-user and does not require authentication. All endpoints work with the default user ID `'single-user'`.

---

*Last Updated: After completion of all APIs*

