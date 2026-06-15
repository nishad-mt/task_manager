# Task Manager

A full-stack task management application built with Django REST Framework, React, and PostgreSQL.

## Tech Stack

- Django
- Django REST Framework
- PostgreSQL
- React
- Vite
- JWT Authentication

## Features

- User Registration
- User Login
- Create Tasks
- Update Tasks
- Delete Tasks
- Mark Tasks Complete

### Task Organization
- Search Tasks by Title
- Filter Tasks by Status
- Filter Tasks by Priority
- Pagination Support
- User-specific Task Access

## Setup

### Backend

cd backend

pip install -r requirements.txt

python manage.py migrate

python manage.py runserver

### Frontend

cd client

npm install

npm run dev

## Environment Variables

Create a `.env` file inside the backend directory and copy the values from `.env.example`.

```bash
cp .env.example backend/.env
```
## Bonus Features

Implemented:
- Pagination for task listing

Not Implemented:
-Categories/Tags
-Backend Unit Tests
-Docker Compose Setup