<h1 align="center">RolePlay AI Consultant</h1>

<p align="center">
  <strong>Practice your consulting pitch with AI-powered executive personas using voice interaction</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=000" alt="React"/>
  <img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=fff" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=fff" alt="Vite"/>
  <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=fff" alt="Tailwind CSS"/>
  <img src="https://img.shields.io/badge/Flask-000000?logo=flask&logoColor=fff" alt="Flask"/>
  <img src="https://img.shields.io/badge/Python-3776AB?logo=python&logoColor=fff" alt="Python"/>
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=fff" alt="PostgreSQL"/>
  <img src="https://img.shields.io/badge/OpenAI-412991?logo=openai&logoColor=fff" alt="OpenAI"/>
  <img src="https://img.shields.io/badge/Socket.IO-010101?logo=socketdotio&logoColor=fff" alt="Socket.IO"/>
  <img src="https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=fff" alt="Docker"/>
  <img src="https://img.shields.io/badge/Nginx-009639?logo=nginx&logoColor=fff" alt="Nginx"/>
  <img src="https://img.shields.io/badge/Cloudflare-F38020?logo=cloudflare&logoColor=fff" alt="Cloudflare"/>
</p>

<p align="center">
  A web application that helps software consultants practice role-playing scenarios with AI-powered executive personas. Select a persona, speak naturally via your microphone, and receive real-time conversational responses with natural-sounding OpenAI TTS voices. Each session ends with structured performance feedback to help you improve.
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#ai-personas">AI Personas</a> •
  <a href="#admin-panel">Admin Panel</a> •
  <a href="#configuration">Configuration</a> •
  <a href="#tech-stack">Tech Stack</a>
</p>

---

## Features

- **Multiple AI Personas** — Practice with a Sr VP of Software, CTO, CIO, or Project Manager, each with unique personality traits and objections
- **Versioned Personas** — Create, edit, and manage personas through the admin panel; every edit is versioned with full history and rollback
- **OpenAI TTS Voices** — Natural-sounding AI responses via OpenAI's `tts-1` model with 9 voice options (alloy, ash, coral, echo, fable, nova, onyx, sage, shimmer)
- **Push-to-Talk Input** — Speak naturally without being cut off on pauses; tap the mic button to finish recording
- **Text Fallback** — Full text input available when microphone access is denied or unsupported
- **Real-Time Chat** — WebSocket-powered conversation with low-latency AI responses
- **Multi-Agent Orchestration** — Central orchestrator routes messages to isolated persona agents with no inter-agent communication
- **Session Feedback** — AI-generated end-of-session performance analysis with score, strengths, and improvement areas
- **Session History** — Review past conversations and feedback to track your progress
- **Google & Microsoft OAuth** — Authenticate with Google or Microsoft 365 (Microsoft configured via admin panel)
- **Admin Panel** — Manage personas, view all report cards, configure Microsoft auth, and connect OneDrive data sources
- **OneDrive Integration** — Augment persona context with organizational documents synced from OneDrive folders
- **Cloudflare Tunnel Support** — Production-ready deployment behind Cloudflare tunnels with automatic proxy header handling
- **Responsive Design** — Works on desktop and mobile browsers
- **Docker Deployment** — One-command deployment with Docker Compose

## Tech Stack

### Frontend
- **React 18** — Modern UI framework with hooks
- **TypeScript** — Type-safe development
- **Vite** — Fast build tooling
- **Tailwind CSS** — Utility-first styling
- **Socket.IO Client** — Real-time WebSocket communication
- **Web Speech API** — Browser-native speech recognition (push-to-talk)

### Backend
- **Python 3.12** — Backend runtime
- **Flask** — Lightweight web framework
- **Flask-SocketIO** — WebSocket support with eventlet
- **SQLAlchemy** — ORM with Alembic migrations
- **Flask-Dance** — Google OAuth 2.0 integration
- **OpenAI SDK** — GPT-4o for persona conversations and feedback; TTS-1 for voice synthesis

### Infrastructure
- **Docker** — Containerized deployment
- **Nginx** — Reverse proxy with WebSocket support and dynamic domain templating
- **PostgreSQL 16** — Relational database for users, sessions, messages, personas, and admin config
- **Docker Compose** — Multi-container orchestration
- **Cloudflare Tunnel** — HTTPS termination and DNS routing

## Quick Start

### Prerequisites
- Docker and Docker Compose
- A domain with Cloudflare Tunnel configured (or modify for local use)
- A Google OAuth client ID and secret ([Google Cloud Console](https://console.cloud.google.com/apis/credentials))
- An OpenAI API key ([OpenAI Platform](https://platform.openai.com/api-keys))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/jleboube/RolePlayAIConsultant.git
   cd RolePlayAIConsultant
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your credentials:
   ```
   FLASK_ENV=production
   DATABASE_URL=REDACTED_SECRET
   DOMAIN=your-domain.example.com
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   OPENAI_API_KEY=your-openai-api-key
   ADMIN_PASSWORD=
   ```
   > `SECRET_KEY` is auto-generated at deploy time. If `ADMIN_PASSWORD` is left empty, a secure one is generated and printed to the backend container logs.

3. **Build and run with Docker**
   ```bash
   docker compose up -d --build
   ```

4. **Access the application**

   Navigate to `https://your-domain.example.com`

5. **Retrieve the admin password** (if auto-generated)
   ```bash
   docker compose logs backend | grep "ADMIN_PASSWORD"
   ```

### Google OAuth Setup

Add the following authorized redirect URI in Google Cloud Console:
```
https://your-domain.example.com/api/auth/google/authorized
```

### Stopping the Application

```bash
docker compose down
```

## AI Personas

| Persona | Focus Areas | Communication Style |
|---------|-------------|---------------------|
| **Senior VP of Software** | ROI, strategic alignment, business impact | Big-picture, time-conscious, skeptical of buzzwords |
| **Chief Technology Officer** | Architecture, security, scalability | Deeply technical, detail-oriented, debates tech choices |
| **Chief Information Officer** | Governance, compliance, digital transformation | Risk-aware, process-oriented, focused on change management |
| **Project Manager** | Timelines, scope, deliverables | Schedule-driven, pragmatic, concerned with dependencies |

Each persona has predefined traits, common objections, and domain knowledge tailored to software consulting scenarios. Custom personas can be created and existing ones modified through the admin panel — every change creates a new version while preserving the full history.

## Admin Panel

Access the admin panel at `/admin` and log in with the admin password from your `.env` or container logs.

### Capabilities

- **Report Cards** — View all users' completed session feedback with scores, strengths, and improvement areas
- **Personas** — Create new personas, edit existing ones (versioned), view version history, restore previous versions, or deactivate personas
- **Microsoft Auth** — Configure Azure AD credentials (client ID, tenant ID, client secret) to enable Microsoft 365 login
- **OneDrive** — Connect to OneDrive via Microsoft Graph API, add folder paths, and sync organizational documents to augment persona context

## User Flow

1. **Landing Page** — Browse features and click "Get Started"
2. **Authenticate** — Sign in with Google or Microsoft
3. **Select Persona** — Choose an executive to practice with
4. **Select Voice** — Pick an OpenAI TTS voice for AI responses
5. **Start Session** — Begin a voice or text-based role-play conversation
6. **End Session** — Receive structured feedback with a score, strengths, and improvement suggestions
7. **Review History** — Revisit past sessions and track your progress

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DOMAIN` | Your domain name (e.g., `training.my-ai.tech`) | Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth 2.0 client ID | Yes |
| `GOOGLE_CLIENT_SECRET` | Google OAuth 2.0 client secret | Yes |
| `OPENAI_API_KEY` | OpenAI API key for GPT-4o and TTS-1 | Yes |
| `DATABASE_URL` | PostgreSQL connection string | No (default provided) |
| `FLASK_ENV` | Flask environment (`development` or `production`) | No |
| `ADMIN_PASSWORD` | Admin panel password (auto-generated if empty) | No |

### Session Feedback

After each session, the AI analyzes the full conversation and provides:

| Metric | Description |
|--------|-------------|
| **Score** | Overall performance rating from 1-10 |
| **Strengths** | 2-3 specific things the consultant did well |
| **Improvements** | 2-3 actionable areas for improvement |
| **Highlights** | Notable moments with commentary |
| **Summary** | One-paragraph overall assessment |

## Development

### Running Tests

```bash
docker compose exec backend pytest tests/ -v
```

### Project Structure

```
RolePlayAIConsultant/
├── backend/
│   ├── app/
│   │   ├── __init__.py              # Flask app factory with ProxyFix
│   │   ├── config.py                # Configuration from env vars
│   │   ├── extensions.py            # DB, SocketIO, login manager
│   │   ├── errors.py                # Global error handlers
│   │   ├── admin/
│   │   │   ├── routes.py            # Admin API (report cards, personas, config)
│   │   │   ├── decorators.py        # Admin auth decorator
│   │   │   └── onedrive_service.py  # Microsoft Graph API for OneDrive
│   │   ├── auth/
│   │   │   ├── routes.py            # Google & Microsoft OAuth routes
│   │   │   └── decorators.py        # WebSocket auth decorator
│   │   ├── chat/
│   │   │   ├── routes.py            # REST endpoints (sessions, personas, TTS)
│   │   │   └── events.py            # WebSocket event handlers
│   │   ├── models/
│   │   │   ├── user.py              # User model (Google + Microsoft auth)
│   │   │   ├── session.py           # ChatSession and Message models
│   │   │   ├── persona.py           # PersonaVersion model (versioned)
│   │   │   ├── admin_config.py      # Key-value admin config store
│   │   │   └── onedrive.py          # OneDriveFolder model
│   │   └── orchestrator/
│   │       ├── orchestrator.py      # Central orchestration with augmentation
│   │       ├── personas.py          # Persona registry (DB-backed with fallback)
│   │       └── feedback.py          # Session feedback generator
│   ├── migrations/                   # Alembic database migrations
│   ├── tests/                        # pytest test suite
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── admin/               # Admin panel tabs (personas, reports, etc.)
│   │   │   ├── landing/             # Hero, features sections
│   │   │   ├── chat/                # Chat UI, persona/voice selectors
│   │   │   ├── history/             # Session list and review
│   │   │   └── common/              # Navbar, Footer, error boundary
│   │   ├── hooks/                    # useAuth, useAdmin, useSocket, useSpeech*
│   │   ├── services/                 # API client, admin API, Socket.IO client
│   │   ├── pages/                    # Landing, Chat, History, Admin pages
│   │   └── types/                    # TypeScript interfaces
│   ├── Dockerfile
│   └── package.json
├── nginx/
│   ├── nginx.conf.template          # Nginx config with domain templating
│   ├── docker-entrypoint.sh         # envsubst for dynamic domain
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/auth/me` | Current user info |
| GET | `/api/auth/login` | Initiate Google OAuth |
| GET | `/api/auth/login/microsoft` | Initiate Microsoft OAuth |
| POST | `/api/auth/logout` | Sign out |
| GET | `/api/auth/providers` | List available auth providers |
| GET | `/api/personas` | List available personas |
| GET | `/api/sessions` | List user's session history |
| GET | `/api/sessions/:id` | Get session with messages |
| POST | `/api/tts` | Generate OpenAI TTS audio |
| POST | `/api/admin/login` | Admin authentication |
| GET | `/api/admin/personas` | List all personas (admin) |
| POST | `/api/admin/personas` | Create new persona |
| PUT | `/api/admin/personas/:name` | Update persona (new version) |
| GET | `/api/admin/personas/:name/versions` | Persona version history |
| GET | `/api/admin/report-cards` | List all report cards |

### WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `start_session` | Client → Server | Start a new role-play session |
| `send_message` | Client → Server | Send a message to the AI |
| `end_session` | Client → Server | End session and request feedback |
| `session_started` | Server → Client | Session created with greeting |
| `ai_response` | Server → Client | AI persona response |
| `session_ended` | Server → Client | Session ended with feedback |
| `error` | Server → Client | Error message |

## Troubleshooting

### Voice input not working

- Ensure you're using Chrome, Edge, or Safari (Firefox has limited Web Speech API support)
- Grant microphone permissions when prompted
- Text input is always available as a fallback

### OAuth redirect errors

- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set correctly in `.env`
- Ensure the authorized redirect URI in Google Cloud Console is `https://your-domain/api/auth/google/authorized`
- For Microsoft OAuth, configure credentials in the admin panel under Microsoft Auth

### AI responses not working

- Verify `OPENAI_API_KEY` is set in `.env`
- Check backend logs: `docker compose logs backend`
- Ensure your OpenAI account has API credits available

### Container health check fails

- Wait 15-20 seconds for the backend to fully start (migrations run first)
- Check logs: `docker compose logs backend`

## License

MIT License - see LICENSE file for details.

---

<p align="center">
  RolePlay AI Consultant &mdash; 2026 &copy; Joe LeBoube - Powered by multi-agent AI orchestration
</p>
