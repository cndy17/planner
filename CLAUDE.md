# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack task management application with:
- **Backend**: Node.js/Express API with Prisma ORM and PostgreSQL database
- **Frontend**: React TypeScript application using Create React App

## Commands

### Backend Development
```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Set up database (first time setup)
npx prisma migrate dev

# Generate Prisma client (after schema changes)
npx prisma generate

# Push schema changes without creating migration
npx prisma db push

# Start backend server (runs on port 4000)
node index.js

# Open Prisma Studio for database inspection
npx prisma studio
```

### Frontend Development
```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server (runs on port 3000)
npm start

# Build for production
npm run build

# Run tests in watch mode
npm test

# Run tests once (CI mode)
CI=true npm test
```

## Architecture

### Database Schema
The application uses PostgreSQL with Prisma ORM. Core models with relationships:
- **Area**: Categories for organizing projects (has many Projects)
- **Project**: Contains multiple tasks, belongs to an Area (optional)
- **Task**: Core entity with hierarchical structure (subtasks via self-relation), can belong to a Project, supports tags, recurrence, and various date/time fields
- **Tag**: Many-to-many relationship with Tasks through "TaskTags" relation

### Backend API
Express server (`backend/index.js`) exposing RESTful endpoints:
- `GET /areas` - Returns areas with their projects
- `GET /projects` - Returns projects with tasks and area
- `GET /tasks` - Returns tasks with tags and project
- `GET /tags` - Returns tags with associated tasks

Configuration:
- Database connection via `DATABASE_URL` environment variable
- Default port: 4000 (configurable via `PORT` env var)
- CORS enabled for cross-origin requests

### Frontend Structure
TypeScript React application with:
- Strict TypeScript compilation (`strict: true`)
- React 19 with latest testing libraries
- Create React App configuration (not ejected)
- Test files colocated with components (`*.test.tsx`)