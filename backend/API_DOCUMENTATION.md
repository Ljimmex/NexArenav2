# API Documentation - Users & Teams CRUD

## Overview
Dokumentacja API dla operacji CRUD na użytkownikach i drużynach w systemie turniejowym.

## Base URL
```
http://localhost:3000/api
```

## Authentication
Wszystkie endpointy wymagają autoryzacji przez Supabase Auth (Bearer token).

---

## Users API

### 1. Create User
**POST** `/users`

Tworzy nowego użytkownika w systemie.

**Request Body:**
```json
{
  "username": "player123",
  "email": "player@example.com",
  "display_name": "Pro Player",
  "avatar_url": "https://example.com/avatar.jpg",
  "bio": "Professional esports player",
  "country": "Poland",
  "city": "Warsaw",
  "date_of_birth": "1995-05-15",
  "role": "PLAYER"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "username": "player123",
  "email": "player@example.com",
  "display_name": "Pro Player",
  "avatar_url": "https://example.com/avatar.jpg",
  "bio": "Professional esports player",
  "country": "Poland",
  "city": "Warsaw",
  "date_of_birth": "1995-05-15",
  "role": "PLAYER",
  "is_active": true,
  "is_verified": false,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z",
  "stats": {
    "games_played": 0,
    "games_won": 0,
    "tournaments_played": 0,
    "tournaments_won": 0,
    "total_prize_money": 0,
    "ranking_points": 0,
    "current_streak": 0,
    "best_streak": 0
  },
  "settings": {
    "notifications_enabled": true,
    "email_notifications": true,
    "privacy_level": "PUBLIC",
    "language": "en",
    "timezone": "UTC"
  }
}
```

### 2. Get All Users
**GET** `/users?page=1&limit=10&search=player`

Pobiera listę użytkowników z paginacją i wyszukiwaniem.

**Query Parameters:**
- `page` (optional): Numer strony (domyślnie 1)
- `limit` (optional): Liczba elementów na stronę (domyślnie 10)
- `search` (optional): Wyszukiwanie w username, display_name, email

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "username": "player123",
      "display_name": "Pro Player",
      "avatar_url": "https://example.com/avatar.jpg",
      "country": "Poland",
      "role": "PLAYER",
      "is_active": true,
      "is_verified": false,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

### 3. Get User by ID
**GET** `/users/{id}`

**Response (200):** Pełny obiekt użytkownika (jak w Create User)

### 4. Get User by Username
**GET** `/users/username/{username}`

**Response (200):** Pełny obiekt użytkownika

### 5. Get User by Supabase ID
**GET** `/users/supabase/{supabaseId}`

**Response (200):** Pełny obiekt użytkownika

### 6. Update User
**PATCH** `/users/{id}`

**Request Body:** Częściowe dane użytkownika (wszystkie pola opcjonalne)

### 7. Delete User
**DELETE** `/users/{id}`

**Response (204):** Brak zawartości

### 8. Update User Stats
**PATCH** `/users/{id}/stats`

**Request Body:**
```json
{
  "games_played": 10,
  "games_won": 7,
  "ranking_points": 1500
}
```

### 9. Update User Settings
**PATCH** `/users/{id}/settings`

**Request Body:**
```json
{
  "notifications_enabled": false,
  "privacy_level": "PRIVATE",
  "language": "pl"
}
```

---

## Teams API

### 1. Create Team
**POST** `/teams`

**Request Body:**
```json
{
  "name": "Team Awesome",
  "tag": "AWSM",
  "description": "Professional esports team",
  "logo_url": "https://example.com/logo.png",
  "banner_url": "https://example.com/banner.jpg",
  "country": "Poland",
  "website": "https://teamawesome.com",
  "discord_url": "https://discord.gg/awesome",
  "twitter_url": "https://twitter.com/teamawesome",
  "max_members": 10,
  "created_by": "user-uuid"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "name": "Team Awesome",
  "tag": "AWSM",
  "description": "Professional esports team",
  "logo_url": "https://example.com/logo.png",
  "banner_url": "https://example.com/banner.jpg",
  "country": "Poland",
  "website": "https://teamawesome.com",
  "discord_url": "https://discord.gg/awesome",
  "twitter_url": "https://twitter.com/teamawesome",
  "max_members": 10,
  "is_active": true,
  "is_verified": false,
  "created_by": "user-uuid",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z",
  "member_count": 1,
  "stats": {
    "games_played": 0,
    "games_won": 0,
    "tournaments_played": 0,
    "tournaments_won": 0,
    "total_prize_money": 0,
    "ranking_points": 0,
    "current_streak": 0,
    "best_streak": 0
  },
  "creator": {
    "id": "user-uuid",
    "username": "creator123",
    "display_name": "Team Creator",
    "avatar_url": "https://example.com/avatar.jpg"
  },
  "members": [
    {
      "id": "member-uuid",
      "user_id": "user-uuid",
      "team_id": "team-uuid",
      "role": "CAPTAIN",
      "is_active": true,
      "joined_at": "2024-01-01T00:00:00Z",
      "user": {
        "id": "user-uuid",
        "username": "creator123",
        "display_name": "Team Creator",
        "avatar_url": "https://example.com/avatar.jpg",
        "country": "Poland"
      }
    }
  ]
}
```

### 2. Get All Teams
**GET** `/teams?page=1&limit=10&search=awesome`

**Query Parameters:**
- `page` (optional): Numer strony
- `limit` (optional): Liczba elementów na stronę
- `search` (optional): Wyszukiwanie w name, tag, description

### 3. Get Team by ID
**GET** `/teams/{id}`

### 4. Get Team by Tag
**GET** `/teams/tag/{tag}`

### 5. Update Team
**PATCH** `/teams/{id}`

### 6. Delete Team
**DELETE** `/teams/{id}`

---

## Team Members API

### 1. Get Team Members
**GET** `/teams/{id}/members`

**Response (200):**
```json
[
  {
    "id": "member-uuid",
    "user_id": "user-uuid",
    "team_id": "team-uuid",
    "role": "CAPTAIN",
    "is_active": true,
    "joined_at": "2024-01-01T00:00:00Z",
    "left_at": null,
    "user": {
      "id": "user-uuid",
      "username": "player123",
      "display_name": "Pro Player",
      "avatar_url": "https://example.com/avatar.jpg",
      "country": "Poland"
    }
  }
]
```

### 2. Add Team Member
**POST** `/teams/{id}/members`

**Request Body:**
```json
{
  "user_id": "user-uuid",
  "role": "PLAYER"
}
```

### 3. Update Team Member
**PATCH** `/teams/{id}/members/{memberId}`

**Request Body:**
```json
{
  "role": "SUBSTITUTE",
  "is_active": false,
  "left_at": "2024-01-01T00:00:00Z"
}
```

### 4. Remove Team Member
**DELETE** `/teams/{id}/members/{memberId}`

### 5. Update Team Stats
**PATCH** `/teams/{id}/stats`

**Request Body:**
```json
{
  "games_played": 25,
  "games_won": 18,
  "tournaments_won": 3,
  "ranking_points": 2500
}
```

---

## Enums

### UserRole
- `ADMIN` - Administrator systemu
- `MODERATOR` - Moderator
- `ORGANIZER` - Organizator turniejów
- `PLAYER` - Gracz
- `VIEWER` - Widz

### TeamRole
- `CAPTAIN` - Kapitan drużyny
- `PLAYER` - Gracz
- `SUBSTITUTE` - Rezerwowy
- `COACH` - Trener
- `MANAGER` - Menedżer

### PrivacyLevel
- `PUBLIC` - Publiczny profil
- `FRIENDS` - Widoczny dla znajomych
- `PRIVATE` - Prywatny profil

---

## Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "User with ID uuid not found",
  "error": "Not Found"
}
```

### 409 Conflict
```json
{
  "statusCode": 409,
  "message": "Username already exists",
  "error": "Conflict"
}
```

---

## Testing

Aby przetestować API, możesz użyć:

1. **Swagger UI**: `http://localhost:3000/api/docs`
2. **Postman**: Importuj kolekcję z endpointami
3. **curl**: Przykładowe zapytania w terminalu

### Przykład curl:
```bash
# Tworzenie użytkownika
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "display_name": "Test User",
    "role": "PLAYER"
  }'

# Pobieranie użytkowników
curl -X GET "http://localhost:3000/api/users?page=1&limit=5" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Notes

1. Wszystkie endpointy wymagają autoryzacji
2. UUID są automatycznie generowane przez bazę danych
3. Timestamps są automatycznie zarządzane
4. RLS (Row Level Security) jest włączone dla wszystkich tabel
5. Walidacja danych jest obsługiwana przez class-validator
6. Swagger dokumentacja jest dostępna pod `/api/docs`