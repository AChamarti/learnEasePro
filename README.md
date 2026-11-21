# LearnEase Pro — MERN Stack Capstone

A full-stack e-learning management system built with MongoDB, Express, React and Node.js. The project includes administrator, instructor and student workflows.

## Features included

- JWT registration/login, role-based authorization, bcrypt password hashing, forgot/reset password flow.
- Course catalogue, categories, pricing, thumbnails (URL), instructor course creation/editing and lesson URLs.
- Student course access requests; admin approval/rejection; student dashboard and lesson completion tracking.
- Lesson video playback (hosted video URL) and downloadable resource links.
- Admin dashboard counts, user list/role management and enrolment report table.
- Student reviews/ratings endpoint (approved students only).
- Course group discussion endpoints and discussion page.
- Responsive React/Vite interface, React Router and Axios API client.

## Requirements

- Node.js 18+
- MongoDB Atlas database

## Run locally

### 1. Backend

```bash
cd server
cp .env.example .env
# Edit MONGO_URI and JWT_SECRET in .env
npm install
npm run dev
```

API runs at `http://localhost:5000`; health check: `http://localhost:5000/api/health`.

### 2. Frontend (new terminal)

```bash
cd client
npm install
npm run dev
```

Open `http://localhost:5173`.

If the API is hosted elsewhere, create `client/.env` with:

```env
VITE_API_URL=http://localhost:5000/api
```

## Create the first administrator

Public registration intentionally permits only `student` and `instructor`. Register a normal account, then promote it directly in MongoDB once:

```javascript
use learneasepro
db.users.updateOne({ email: "admin@example.com" }, { $set: { role: "admin" } })
```

Log out and back in so the new role is reflected in the JWT and user session. Never expose an unrestricted public admin-registration option.

## Main API routes

| Method | Route | Access | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register student/instructor |
| POST | `/api/auth/login` | Public | Login |
| GET | `/api/auth/me` | Authenticated | Current user |
| POST | `/api/auth/forgot-password` | Public | Request reset link |
| POST | `/api/auth/reset-password/:token` | Public | Set new password |
| GET | `/api/courses` | Public | Published course catalogue |
| GET | `/api/courses/:id` | Public | Course details and reviews |
| POST | `/api/courses` | Instructor/admin | Create course |
| PATCH/DELETE | `/api/courses/:id` | Owner/admin | Update/delete course |
| POST | `/api/courses/:id/enrol` | Student | Request course access |
| POST | `/api/courses/:id/reviews` | Approved student | Create/update rating |
| GET | `/api/learning/mine` | Student | Own enrolments and progress |
| PATCH | `/api/learning/:enrollmentId/lessons/:lessonId/complete` | Student | Mark lesson complete |
| GET | `/api/admin/stats` | Admin | Dashboard counts |
| GET | `/api/admin/users` | Admin | User list |
| PATCH | `/api/admin/users/:id/role` | Admin | Change user role |
| GET | `/api/admin/enrollments` | Admin | Enrolment report |
| PATCH | `/api/admin/enrollments/:id` | Admin | Approve/reject request |
| GET/POST | `/api/discussions/:courseId` | Course member/instructor/admin | Read/post group messages |

All protected routes use `Authorization: Bearer <JWT>`.

## Suggested project structure

```text
learnease-pro/
  client/                 # React + Vite frontend
    src/api/              # Axios client
    src/components/       # Layout and route guards
    src/context/          # Authentication context
    src/pages/            # Home, auth, courses, learning, admin
  server/                 # Express API
    src/config/            # MongoDB connection
    src/middleware/        # JWT and role checks
    src/models/            # Mongoose schemas
    src/routes/            # REST API routes
    src/utils/             # Token helpers
```

## Capstone scope alignment

The supplied PDF calls the project **LearnEase Pro** and specifies an eLearning platform for learners, faculties/instructors and administrators. It also asks for course access requests, course updates, feedback/ratings, group chat, materials such as documents/videos/presentations, Git version control and learner progress tracking. These are reflected in this implementation where practical; see the implementation notes for features that need a production provider or a follow-on sprint.
