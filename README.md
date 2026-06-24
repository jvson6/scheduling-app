# AI Scheduler

This is full-stack GenAI scheduling app. Users can sign up, sign in, and load in a dashboard
where they can describe an event in plain English (e.g. "lunch with Sam next Tuesday
at noon") then Google's Gemini API parses the request into a structured event and saves
it to the database on MongoDB. Events can also be added manually and deleted.

## Features

- Sign up / sign in with hashed passwords (bcrypt) and server-side sessions
  (express-session, persisted in MongoDB via connect-mongo)
- Protected dashboard route — only accessible while logged in
- Natural-language event creation powered by the Gemini API (`gemini-flash-3`):
  the model extracts a title, date, time, and description from free text and the
  app resolves relative dates ("next Friday") to absolute dates
- Manual event entry as a fallback/alternative to the AI flow
- Full CRUD on events: create (AI or manual), read (list per user), update endpoint
  available (`PUT /api/events/:id`), delete
- Responsive UI with no external frontend framework (vanilla HTML/CSS/JS)

## Tech Stack

- **Frontend:** HTML, CSS, vanilla JavaScript (fetch API)
- **Backend:** Node.js, Express
- **Database:** MongoDB with Mongoose
- **Auth:** express-session + connect-mongo (session store), bcrypt (password hashing)
- **AI:** Google Gemini API (`@google/generative-ai`)

## Database Schema

**User**
| Field     | Type   | Notes              |
|-----------|--------|--------------------|
| username  | String | required, unique   |
| email     | String | required, unique   |
| password  | String | required, bcrypt hash |
| createdAt | Date   | default: now        |

**Event**
| Field       | Type     | Notes                          |
|-------------|----------|---------------------------------|
| user        | ObjectId | required, references User       |
| title       | String   | required                        |
| date        | String   | required, format `YYYY-MM-DD`   |
| time        | String   | optional, format `HH:MM`        |
| description | String   | optional                        |
| createdAt   | Date     | default: now                    |

## API Endpoints

| Method | Endpoint              | Description                                   |
|--------|------------------------|------------------------------------------------|
| POST   | /api/auth/signup       | Create a new user account, starts a session    |
| POST   | /api/auth/login        | Log in with username/email + password          |
| POST   | /api/auth/logout       | Destroy the current session                    |
| GET    | /api/auth/me           | Get the currently logged-in username           |
| GET    | /api/events            | List the logged-in user's events               |
| POST   | /api/events            | Manually create an event                       |
| POST   | /api/events/parse      | Send free text, Gemini parses + creates an event |
| PUT    | /api/events/:id        | Update an event                                |
| DELETE | /api/events/:id        | Delete an event                                |

