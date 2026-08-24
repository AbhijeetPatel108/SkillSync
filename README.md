# SkillSync

SkillSync is a full-stack application that helps students find suitable teammates for projects, hackathons, and internships. The platform matches users based on technical skills, interests, and project requirements.

## Features

- Secure user authentication with JWT and bcrypt
- Create and manage student profiles
- Skill and interest-based teammate recommendations
- Advanced profile search and filtering
- Match request flow for accepted/rejected/cancelled requests
- Review and rating system
- Real-time chat via Socket.IO
- MySQL-backed persistence with SQL joins, indexes, and transactions

## Tech Stack

- React
- Tailwind CSS
- Node.js
- Express.js
- MySQL
- JWT
- bcrypt

## Local setup

1. Create a MySQL database, for example:
   `CREATE DATABASE skillsync CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
2. Run the schema script:
   `mysql -u <user> -p < database/schema.sql`
3. Copy the example environment file and configure your local values:
   `cp server/.env.example server/.env`
4. Install backend dependencies:
   `cd server && npm install`
5. Start the backend:
   `cd server && npm run dev`
6. Start the frontend:
   `cd client && npm install && npm run dev`

## Environment variables

Create `server/.env` with:

```env
PORT=5000
CLIENT_URL=http://localhost:5173
JWT_SECRET=change_me
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=skillsync
```
