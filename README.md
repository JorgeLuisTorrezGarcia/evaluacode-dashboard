# EvaluaCode Frontend

AI-powered exam grading platform - Modern SPA built with React, TypeScript, and Vite.

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ LTS
- pnpm (recommended) or npm

### Installation
```bash
# Install dependencies
pnpm install

# Configure environment variables
cp .env.example .env
# Edit .env with your API base URL

# Start development server
pnpm dev
```

### Available Scripts
```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm preview      # Preview production build
pnpm lint         # Run ESLint
```

## 🏗️ Architecture

### Technology Stack
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS + shadcn/ui
- **Routing**: React Router v6
- **State Management**: Zustand
- **Data Fetching**: React Query + Axios
- **Forms**: React Hook Form + Zod

### Project Structure
```
src/
├── components/       # Reusable UI components
│   ├── ui/          # shadcn/ui components
│   ├── ProtectedRoute.tsx
│   └── AppLayout.tsx
├── pages/           # Route pages
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── Dashboard.tsx
│   ├── Courses.tsx
│   └── Exams.tsx
├── stores/          # Zustand stores
│   └── auth-store.ts
├── lib/             # Utilities
│   ├── api-client.ts
│   └── utils.ts
└── hooks/           # Custom React hooks
```

## 🔐 Authentication

The app uses JWT-based authentication with automatic token refresh:

1. **Access Token**: Short-lived (15 min), stored in localStorage
2. **Refresh Token**: Long-lived (7 days), stored in localStorage
3. **Automatic Refresh**: Interceptor handles token refresh on 401 errors

### API Client Features
- Automatic auth header injection
- Token refresh flow
- Error handling with toast notifications
- Request/response interceptors

## 🎨 Design System

### Color Palette
- **Primary**: Deep blue/indigo for trust and professionalism
- **Success**: Emerald green for positive actions
- **Warning**: Amber for alerts
- **Destructive**: Red for errors

### Key Design Tokens
```css
--primary: Deep blue (HSL: 217 91% 40%)
--success: Emerald green (HSL: 160 84% 39%)
--gradient-primary: Blue-to-indigo gradient
--shadow-elegant: Subtle elevation shadow
```

### Component Variants
All components use semantic tokens from the design system defined in `src/index.css` and `tailwind.config.ts`. No hardcoded colors in components.

## 🛣️ Routing & Guards

### Route Protection
- `<ProtectedRoute>`: Requires authentication
- Role-based access with `allowedRoles` prop
- Automatic redirect to `/login` if not authenticated
- Redirect to `/unauthorized` if insufficient permissions

### Routes
- `/` → Redirects to dashboard or login
- `/login` → Login page
- `/register` → Registration page
- `/dashboard` → Role-specific dashboard
- `/courses` → Course listing and management
- `/exams` → Exam listing and management
- `/unauthorized` → Access denied page

## 📦 State Management

### Zustand Stores
- **Auth Store**: User session, tokens, role
  - Persisted to localStorage
  - Auto-hydrates on app load

## 🔌 API Integration

### Base Configuration
```typescript
API_BASE_URL: http://localhost:3000 (configurable via .env)
```

### Key Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Token refresh
- `GET /api/courses` - List courses
- `GET /api/exams` - List exams
- `GET /api/health` - System health check

### Error Handling
- Centralized error handling in API client
- Toast notifications for user-facing errors
- Automatic logout on auth failure

## 🎯 Key Features

### Implemented
- ✅ Authentication (login, register, logout)
- ✅ Role-based routing (admin, docente, estudiante)
- ✅ Dashboard with role-specific content
- ✅ Courses listing with search
- ✅ Exams listing with status badges
- ✅ Responsive navigation layout
- ✅ System health monitoring
- ✅ Dark mode ready design system

### TODO - Backend Integration Pending
- 🔲 Course CRUD operations
- 🔲 Exam creation and editing
- 🔲 Exam submission flow (student)
- 🔲 Grading interface (teacher)
- 🔲 File upload component
- 🔲 User management (admin)
- 🔲 Enrollment management
- 🔲 Grade reports

## 🧪 Testing

```bash
# Run tests (when implemented)
pnpm test

# Run tests with coverage
pnpm test:coverage
```

## 📱 Responsive Design

The app is fully responsive with breakpoints:
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

## 🌐 Environment Variables

```env
VITE_API_BASE_URL=http://localhost:3000  # Backend API URL
VITE_USE_MOCK_DATA=false                 # Enable mock data for development
```

## 🚀 Deployment

```bash
# Build for production
pnpm build

# Preview production build locally
pnpm preview
```

The `dist/` folder contains the production-ready static files.

## 📝 Code Style

- ESLint + Prettier configured
- TypeScript strict mode enabled
- Component naming: PascalCase
- File naming: PascalCase for components, kebab-case for utilities

## 🤝 Contributing

1. Follow the established patterns
2. Use semantic tokens from design system
3. Write TypeScript with proper types
4. Test authentication flows thoroughly
5. Update README for new features

## 📄 License

This project is part of the EvaluaCode platform.
