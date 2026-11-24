# LearnEase Pro — MERN E-Learning Management System

A MERN-stack learning platform with role-based access for administrators, instructors and students.

## Features

- JWT authentication, password hashing and password reset flow.
- Course catalogue, categories, pricing, instructor course management and admin moderation.
- Student course access requests and administrator approval.
- Lesson videos are added by pasting a shareable YouTube, Vimeo or direct MP4/WebM/MOV URL; 
- Multiple-choice quizzes and pass marks.
- Real-time course group chat.
- Course reviews and ratings for approved students.
- Admin statistics, user/role management and enrolment reports.

## Requirements

- Node.js 18.18+ (Node 20 LTS recommended)
- MongoDB Atlas or local MongoDB

## 1. Configure the backend

```bash
cd server
npm install
cp .env.example .env
```

Edit `server/.env`:

```env
PORT=5000
MONGO_URI=mongodb+srv://USER:PASSWORD@YOUR_CLUSTER.mongodb.net/test?retryWrites=true&w=majority
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173


Generate a JWT secret with:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Start the API and Socket.IO server:

```bash
npm run dev
```

Health check: `http://localhost:5000/api/health`

## 2. Configure the frontend

In another terminal:

```bash
cd client
npm install
```

Optional `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

Start Vite:

```bash
npm run dev
```

Open `http://localhost:5173`.

## 3. Create the first administrator

1. Register a normal account in the app.
2. In MongoDB Atlas Data Explorer, open the database selected in `MONGO_URI` and its `users` collection.
3. Edit that user's `role` from `student` to `admin`.
4. Sign out and sign in again so the app receives a fresh JWT/user role.

Never expose admin registration publicly.

## 4. Adding lesson videos by URL (no video download required)

In Instructor Studio, paste a share link into the **Video URL** field when adding a lesson. Supported sources:

- YouTube standard links (`youtube.com/watch?v=...`), short links (`youtu.be/...`), Shorts, live and embed links. The learner page embeds YouTube using its privacy-enhanced player domain.
- Vimeo video links. The learner page embeds the Vimeo player.
- Direct HTTPS video file URLs ending in `.mp4`, `.webm` or `.mov`. These play in the browser's native video player.

The video must allow embedding when using YouTube or Vimeo. Private videos, age/region-restricted videos, or videos whose owner disables embedding may not play. For direct video URLs, the host must permit browser playback (including CORS/range requests where required). Only paste links to videos you own or are authorised to use.


## 5. Workflow

- Instructor creates a course, uploads a thumbnail and optional learning resources, pastes a video URL for each lesson, adds lessons, and publishes it.
- Instructor opens **Manage quizzes** to create assessments and correct answers.
- Student requests access to a course; an admin approves or rejects the request.
- Approved students can watch videos, mark lessons complete, take quizzes and join its live group chat.
- Admin manages users, enrolment requests and platform reports.

## API additions

- `POST /api/uploads` — authenticated multipart file upload.
- `POST /api/quizzes/course/:courseId` — create quiz (course owner/admin).
- `GET /api/quizzes/course/:courseId` — list course quizzes for an authorised learner or manager.
- `POST /api/quizzes/:id/attempts` — submit and grade a student attempt.
- `POST /api/payments/checkout/:courseId` — create Stripe Checkout session.
- `POST /api/payments/webhook` — verify Stripe events and activate paid enrolments.

## Security notes

- Never commit `.env` files or share database, JWT.
- Use HTTPS, a restrictive CORS origin, strong secrets, backups and a production file-size policy when deploying.
- For production, add virus scanning and stricter MIME/content validation for user uploads.

## Build and checks

```bash
cd client && npm run build
cd ../server && npm start
```

External services (MongoDB) require your own credentials and cannot be activated by the source archive itself.

## Session security update (automatic logout)

LearnEase Pro now validates the saved login token against `GET /api/auth/me` whenever the frontend starts. If the token is invalid, expired, or the account no longer exists, the frontend clears the saved login and sends the user to the login page. Any later API response with HTTP 401 also clears the session.

The backend also creates a fresh server-session identifier every time it starts. JWTs issued by a previous backend process are rejected after a restart, so users must sign in again after you stop and rerun the backend. This is intentional for local development and demonstrations: restarting the API signs out all users. It does not delete user accounts, courses, enrolments, or other MongoDB data.

After installing this update, restart both the backend and frontend. Existing tokens from older versions will be rejected once; sign in again. Keep `JWT_SECRET` private and unchanged between ordinary runs. The server-session identifier is generated automatically and must not be added to `.env`.
