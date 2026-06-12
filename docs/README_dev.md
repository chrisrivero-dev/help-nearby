# Developer Reference Guide

## Tech Stack

| Layer                   | Technology           |
| ----------------------- | -------------------- |
| **Backend Framework**   | FastAPI              |
| **Python Version**      | 3.12                 |
| **Virtual Environment** | uv                   |
| **Database ORM**        | SQLAlchemy           |
| **Migrations**          | Alembic              |
| **Server**              | Uvicorn              |
| **Frontend**            | Next.js (App Router) |

---

## Backend Development

### Starting the Server

```bash
cd backend
uv run uvicorn app.main:app --host 0.0.0.0 --port 9000 --reload
```

The server will be available at `http://localhost:9000`.

**API Docs:** `http://localhost:9000/docs` (FastAPI auto-generated Swagger UI)

### Installing Dependencies

```bash
cd backend
uv sync
```

### Running Tests

```bash
cd backend
uv run pytest
```

### Linting

```bash
cd backend
uv run ruff check .
```

### Type Checking

```bash
cd backend
uv run mypy .
```

### Running Migrations

```bash
# Apply pending migrations
uv run alembic upgrade head

# Create a new migration
uv run alembic revision -m "migration message"
```

---

## Environment Variables

Create a `.env` file in the `backend` directory:

```env
DATABASE_URL=postgresql+psycopg2://user:password@localhost:5432/dbname
S3_BUCKET_NAME=helpnearby.co
S3_REGION=us-east-1
MAILING_LIST_FILE_PATH=mailing-list/preview-signup.json
```

---

## Docker

### Build Image

```bash
docker build -t help-nearby-backend backend
```

### Run Container

```bash
docker run -p 9000:9000 --env-file backend/.env help-nearby-backend
```

---

## API Endpoints

| Method | Path                          | Description               |
| ------ | ----------------------------- | ------------------------- |
| GET    | `/health`                     | Health check              |
| GET    | `/api/get-mailing-list-count` | Get mailing list count    |
| POST   | `/api/join-mailing-list`      | Add email to mailing list |

---

## Quick Commands

```bash
# Start backend
cd backend && uv run uvicorn app.main:app --reload

# Run tests
cd backend && uv run pytest --cov=app

# Lint
cd backend && uv run ruff check .

# Type check
cd backend && uv run mypy .
```
