# Gemini Project Context: EvaluaCode Frontend

## Project Overview

This is the frontend for **EvaluaCode**, an AI-powered exam grading platform. It is a modern Single-Page Application (SPA) built with a robust and type-safe technology stack.

- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with a design system built upon `shadcn/ui`.
- **Routing**: React Router v6, featuring role-based protected routes.
- **State Management**: Zustand, primarily for handling authentication state (`auth-store.ts`).
- **Data Fetching**: React Query and Axios for efficient server-state synchronization and API requests.
- **Forms**: React Hook Form with Zod for schema validation.

The application features JWT-based authentication (access and refresh tokens), a responsive layout, and a clear, role-based architecture (admin, docente, estudiante).

## Building and Running

The project uses **Bun** as its package manager, indicated by the `bun.lockb` file.

### Key Commands:

- **Install Dependencies:**
  ```bash
  bun install
  ```

- **Run Development Server:**
  Starts the app on a local server, typically `http://localhost:5173`.
  ```bash
  bun run dev
  ```

- **Build for Production:**
  Creates a `dist/` directory with optimized static assets.
  ```bash
  bun run build
  ```

- **Lint Code:**
  Analyzes the code for style and quality issues using ESLint.
  ```bash
  bun run lint
  ```

## Development Conventions

- **Project Structure**: The `src/` directory is organized by feature:
  - `pages/`: Top-level components for each route (e.g., `Dashboard.tsx`, `Login.tsx`).
  - `components/`: Reusable components, including UI primitives from `shadcn/ui` in `components/ui/`.
  - `stores/`: Global state management with Zustand (e.g., `auth-store.ts`).
  - `lib/`: Core utilities, including the configured Axios instance (`api-client.ts`).
  - `hooks/`: Custom React hooks.
- **Authentication**: The API client in `src/lib/api-client.ts` automatically injects authorization headers and handles JWT refresh logic.
- **Styling**: Follows the `shadcn/ui` methodology. New UI elements should be created using its conventions, and styling is managed via Tailwind CSS utility classes and CSS variables defined in `src/index.css`.
- **Environment**: The backend API URL is configured via `VITE_API_BASE_URL` in a `.env` file. An example is provided in `.env.example`.
