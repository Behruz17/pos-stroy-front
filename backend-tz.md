# Техническое Задание (ТЗ) - Backend API

## Общее описание

Backend API для системы управления пользователями (ERM). Авторизация через JWT Bearer Token.

---

## Модель данных

### Таблица `users`

| Поле | Тип | Описание |
|------|-----|----------|
| id | INTEGER PK AUTOINCREMENT | Уникальный идентификатор |
| login | VARCHAR(50) UNIQUE NOT NULL | Логин пользователя |
| password | VARCHAR(255) NOT NULL | Хеш пароля (bcrypt) |
| name | VARCHAR(100) NOT NULL | Имя пользователя |
| role | ENUM('ADMIN', 'USER') DEFAULT 'USER' | Роль пользователя |
| created_at | TIMESTAMP DEFAULT CURRENT_TIMESTAMP | Дата создания |

---

## Авторизация

Все защищенные эндпоинты требуют заголовок:
```
Authorization: Bearer <token>
```

Token выдается при успешном `/auth/login`.

---

## Эндпоинты

### Auth

#### POST `/api/auth/login`
Авторизация. **Публичный.**

**Request:**
```json
{
  "login": "admin",
  "password": "password123"
}
```

**Response 200:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "login": "admin",
    "name": "Admin User",
    "role": "ADMIN"
  }
}
```

**Errors:**
- `400` — Login и password обязательны
- `401` — Неверный login или password

---

#### POST `/api/auth/logout`
Выход. **Требует токен.**

**Response 200:**
```json
{
  "message": "ok"
}
```

---

#### GET `/api/auth/me`
Текущий пользователь. **Требует токен.**

**Response 200:**
```json
{
  "id": 1,
  "login": "admin",
  "name": "Admin User",
  "role": "ADMIN"
}
```

**Errors:**
- `401` — Токен невалиден

---

#### POST `/api/auth/register`
Создание пользователя. **Только ADMIN.**

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request:**
```json
{
  "login": "newuser",
  "password": "password123",
  "name": "New User",
  "role": "USER"
}
```

**Response 201:**
```json
{
  "id": 5,
  "login": "newuser",
  "name": "New User",
  "role": "USER",
  "created_at": "2026-04-04T18:00:00.000Z",
  "message": "User created successfully"
}
```

**Errors:**
- `400` — Login и password обязательны / Пользователь уже существует
- `403` — Только ADMIN может создавать пользователей

---

### Users

#### GET `/api/users`
Список всех пользователей. **Только ADMIN.**

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response 200:**
```json
[
  {
    "id": 1,
    "login": "admin",
    "name": "Admin User",
    "role": "ADMIN",
    "created_at": "2026-04-04T18:00:00.000Z"
  },
  {
    "id": 2,
    "login": "user1",
    "name": "User One",
    "role": "USER",
    "created_at": "2026-04-04T18:00:00.000Z"
  }
]
```

---

#### GET `/api/users/:id`
Получить одного пользователя. **Только ADMIN.**

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response 200:**
```json
{
  "id": 1,
  "login": "admin",
  "name": "Admin User",
  "role": "ADMIN",
  "created_at": "2026-04-04T18:00:00.000Z"
}
```

**Errors:**
- `404` — Пользователь не найден

---

#### PUT `/api/users/:id`
Обновить пользователя. **Только ADMIN.**

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request:**
```json
{
  "login": "updated",
  "name": "Updated Name",
  "role": "USER"
}
```

**Response 200:**
```json
{
  "id": 1,
  "login": "updated",
  "name": "Updated Name",
  "role": "USER",
  "created_at": "2026-04-04T18:00:00.000Z",
  "message": "User updated successfully"
}
```

**Ограничения:**
- ADMIN не может изменить свою роль (защита от блокировки)

**Errors:**
- `400` — Нельзя изменить свою роль
- `404` — Пользователь не найден

---

#### DELETE `/api/users/:id`
Удалить пользователя. **Только ADMIN.**

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response 200:**
```json
{
  "message": "User deleted successfully"
}
```

**Ограничения:**
- ADMIN не может удалить сам себя

**Errors:**
- `400` — Нельзя удалить самого себя
- `404` — Пользователь не найден

---

## Технические требования

### JWT Token
- Algorithm: HS256
- Secret: хранить в .env
- Expires: 24 часа
- Payload: `{ userId, login, role }`

### Хеширование паролей
- bcrypt с salt rounds = 10

### Валидация
- login: min 3 символа, alphanumeric + underscore
- password: min 6 символов
- name: обязательное поле
- role: только "ADMIN" или "USER"

### CORS
- Разрешить запросы с фронтенда
- Credentials: true

### База данных
- SQLite / PostgreSQL / MySQL — на выбор

---

## Пример структуры проекта

```
backend/
├── src/
│   ├── config/
│   │   └── database.js
│   ├── middleware/
│   │   ├── auth.js          # JWT проверка
│   │   └── role.js          # Проверка роли ADMIN
│   ├── routes/
│   │   ├── auth.js          # /auth/*
│   │   └── users.js         # /users/*
│   ├── controllers/
│   │   ├── authController.js
│   │   └── userController.js
│   ├── models/
│   │   └── User.js
│   └── app.js
├── .env
├── package.json
└── README.md
```

---

## Stack рекомендации

- **Node.js + Express** — сервер
- **Prisma / Sequelize** — ORM
- **SQLite** — для разработки, **PostgreSQL** — для продакшена
- **jsonwebtoken** — JWT
- **bcryptjs** — хеширование
- **cors** — CORS middleware
- **dotenv** — переменные окружения
