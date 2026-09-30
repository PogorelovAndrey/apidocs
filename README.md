# API Docs — Internal API Documentation System

Внутренняя система документирования API в стиле Postman. Хранит методы, request/response и позволяет тестировать API прямо в браузере.

## Стек
- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Хранилище**: JSON-файлы (без внешней БД)
- **Деплой**: Docker Compose

## Быстрый старт

### 1. Клонировать и настроить
```bash
cp .env.example .env
# Отредактировать .env — изменить JWT_SECRET
```

### 2. Запустить через Docker
```bash
docker-compose up -d --build
```

Приложение доступно на `http://localhost:8080`

### 3. Войти в систему
| Логин | Пароль | Роль |
|-------|--------|------|
| `admin` | `admin123` | Администратор (полный доступ) |

> ⚠️ Сразу после первого входа измените пароль администратора!

## Разработка (без Docker)

### Backend
```bash
cd backend
npm install
npm run dev   # запускается на :3001
```

### Frontend
```bash
cd frontend
npm install
npm run dev   # запускается на :5173, проксирует /api → :3001
```

## Структура проекта
```
api-docs/
├── docker-compose.yml
├── .env.example
├── backend/
│   ├── server.js
│   ├── middleware/
│   │   └── auth.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── projects.js
│   │   ├── methods.js
│   │   └── history.js
│   └── data/           ← JSON-файлы (volume mount)
│       ├── users.json
│       ├── projects.json
│       ├── history.json
│       ├── methodIndex.json
│       └── methods/
└── frontend/
    └── src/
        ├── pages/
        ├── components/
        ├── contexts/
        └── api/
```

## Права доступа
| Действие | Admin | Viewer |
|----------|-------|--------|
| Просмотр методов | ✅ | ✅ |
| Тестирование API | ✅ | ✅ |
| История запросов | ✅ | ✅ |
| Создание/редактирование | ✅ | ❌ |
| Удаление | ✅ | ❌ |

## Бэкап данных
Все данные хранятся в `backend/data/`. Для бэкапа достаточно скопировать эту папку.

## Смена пароля (вручную)
```bash
# Зайти в контейнер
docker exec -it api-docs-backend sh

# Сгенерировать новый hash (node)
node -e "const b=require('bcryptjs'); b.hash('newpassword',10).then(h=>console.log(h))"

# Обновить users.json вручную или через будущий API управления пользователями
```
