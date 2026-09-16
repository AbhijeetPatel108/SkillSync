# SkillSync

SkillSync is a full-stack student collaboration platform that helps users find teammates, publish project ideas, request collaborations, communicate after acceptance, and exchange reviews.

## Features

- Secure registration and login with JWT and bcryptjs
- Student profiles with offered and wanted skills
- Skill search with filtering, sorting, and pagination
- Create, browse, update, and delete owned projects with associated skills
- Collaboration requests with pending, accepted, rejected, and cancelled states
- Real-time chat after a match is accepted
- Review and rating system with cached user aggregates
- Backend-enforced project ownership authorization
- Admin-only user directory protected by role-based authorization
- MySQL persistence with SQL joins, indexes, foreign keys, constraints, and pagination

## Architecture

```text
React page
  -> feature service
  -> shared Axios instance
  -> Express route
  -> JWT/role/ownership middleware
  -> controller
  -> parameterized MySQL query
  -> JSON response
  -> React state
```

Socket.IO uses the same JWT identity and checks accepted-match membership before allowing users to join rooms, send messages, or update read state.

## Tech Stack

- React and Vite
- Tailwind CSS
- Node.js and Express.js
- MySQL with `mysql2/promise`
- JWT with `jsonwebtoken`
- Password hashing with `bcryptjs`
- Socket.IO

## Database

The schema in `database/schema.sql` uses InnoDB tables for users, offered/wanted skills, projects, project skills, matches, messages, read receipts, and reviews. Primary keys, foreign keys, unique constraints, and indexes represent ownership, relationships, active-match uniqueness, search filters, joins, and pagination paths.

Project records belong to `users` through `projects.owner_id`. Project skills belong to projects through `project_skills.project_id` and are deleted with their project. Active match requests are protected by a canonical unique pair key so opposite-direction pending or accepted requests conflict at the database layer. For an existing database created from the earlier schema, apply `database/migration_001_projects_and_relationships.sql` after the base schema.

## Authorization

Authenticated users can manage their own profiles and projects. Project update and delete operations verify `owner_id` on the backend. `GET /api/admin/users` requires the database role `admin`; normal users receive `403 Forbidden` even when calling the endpoint directly. Frontend role checks only control navigation visibility and are not the security boundary.

## API Overview

The API includes authentication, profiles and skills, project CRUD/search, collaboration requests, reviews, chat, and an admin-only paginated user listing. The complete endpoint table and code-grounded interview questions are in `SKILLSYNC_INTERVIEW_GUIDE.md`.

## Local Setup

1. Create the database and schema:

```powershell
mysql -u <user> -p < database/schema.sql
```

2. Create `server/.env`:

```env
PORT=5000
CLIENT_URL=http://localhost:5173
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=7d
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=skillsync
```

3. Install backend dependencies and start the API:

```powershell
cd server
npm install
npm run dev
```

4. Install frontend dependencies and start Vite in a second terminal:

```powershell
cd client
npm install
npm run dev
```

The frontend uses `http://localhost:5000/api` by default. The client development server normally runs at `http://localhost:5173`.

## Validation Commands

```powershell
cd client
npm run build
npm run lint
```

The build is expected to pass. The current lint configuration still reports existing React effect/export-rule findings in several pages; those are documented in the interview guide rather than addressed through broad behavioral rewrites.

## Honest Scope Notes

Project management is implemented as project ownership, lifecycle status, descriptions, and associated skill names. There is no project membership workflow. The application has backend resource authorization and an active admin-only endpoint, but it does not yet provide a larger admin moderation system. No numerical performance improvement is claimed without benchmark data.
