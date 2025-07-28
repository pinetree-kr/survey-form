# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Cloudflare deployment
npm run deploy

# Local preview (Cloudflare)
npm run preview

# Generate Cloudflare types
npm run cf-typegen
```

## Supabase Commands

```bash
# Start local Supabase
npm run supabase:start

# Stop local Supabase
npm run supabase:stop

# Reset database (migrations + seed)
npm run supabase:db:reset

# Push migrations
npm run supabase:db:push

# Function management
npm run supabase:functions:new
npm run supabase:functions:serve
npm run supabase:functions:deploy
```

## Architecture Overview

This is a **Next.js 15 survey form application** with the following key characteristics:

### Tech Stack
- **Frontend**: Next.js 15 with App Router, React 19, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **Deployment**: Cloudflare Workers with OpenNext.js adapter
- **UI Components**: Headless UI, Heroicons, React Toastify
- **Drag & Drop**: @dnd-kit for form builder interface

### Core Architecture

**Authentication & Authorization**:
- Role-based access control (admin, user, moderator)
- Supabase Auth with RLS (Row Level Security)
- Profile management with user roles

**Survey System**:
- Complex survey builder with multiple question types
- Support for branching logic and conditional questions
- Anonymous and authenticated responses
- Email notification system for responses

**Data Layer**:
- TypeScript-first with comprehensive type definitions
- Supabase client abstraction for SSR, browser, and Cloudflare environments
- Database schema with migrations in `supabase/migrations/`

### Key Directories

- `app/` - Next.js App Router pages and API routes
- `app/dashboard/` - Admin interface for survey management
- `app/auth/` - Authentication pages and components
- `app/components/` - Shared components and type definitions
- `lib/` - Utility functions and Supabase client configurations
- `supabase/` - Database migrations and configuration

### Question Types Supported
- `short_text` - Single line text input
- `long_text` - Multi-line text area
- `single_choice` - Radio buttons
- `multiple_choice` - Checkboxes
- `dropdown` - Select dropdown
- `composite_single` - Single complex question with multiple inputs
- `composite_multiple` - Multiple complex questions
- `description` - Information display only

### Database Environment

The application uses Supabase with three client configurations:
- `supabase-ssr.ts` - Server-side rendering with cookie management
- `supabase-browser.ts` - Client-side operations
- `supabase-cloudflare.ts` - Cloudflare Workers environment

### Deployment Configuration

Configured for Cloudflare Workers deployment:
- Uses OpenNext.js adapter for Cloudflare compatibility
- Hyperdrive configuration for database connection pooling
- Environment variables managed through Cloudflare Secrets

### Testing & Development

Default accounts for testing:
- Admin: `admin@example.com` / `password123`
- User: `user@example.com` / `password123`

Use `npm run supabase:db:reset` to reset local database with sample data.