# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React-based diary calendar application that displays a visual timeline of diary entries. The app shows calendar months with highlighted diary dates and automatically scrolls through them with associated images.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (runs on default Vite port 5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Architecture

### Core Application Flow

The application follows a calendar-based diary viewing system with these key components:

1. **Main Entry Point** (`src/index.jsx`): Renders the React app with StrictMode enabled
2. **App Component** (`src/App.jsx`): Central component managing:
   - Auto-scroll functionality with time-based progression through diary entries
   - Manual scroll interaction with temporary pause/resume of auto-play
   - Image loading and fallback to default image when specific date images are missing
   - Calendar grid display with active date highlighting

### Key Architectural Patterns

**State Management**: Uses React hooks (useState, useRef, useEffect) for:
- `activeDate`: Currently displayed diary entry (month/day)
- `isPlaying`: Auto-scroll playback state
- Multiple refs for managing timers, scroll position, and pause states

**Scroll System**: Sophisticated dual-mode scrolling:
- Auto-scroll progresses through diary entries at 2-second intervals
- Manual scroll detection pauses auto-play temporarily
- Smart position calculation to center entries in viewport
- Debounced scroll handling to detect when user stops scrolling

**Image Management**:
- Images stored in `/src/image/` with naming pattern: `{day}-{month}.jpeg`
- Dynamic image loading with fallback to `default.jpeg`
- Pre-loading mechanism to check image existence before display

### Data Structure

**Diary Entries** (`src/utils/calendar.js`):
- Hardcoded diary dates for January, February, and March 2025
- January: 16 diary entries
- February: 16 diary entries
- March: All 31 days have entries

**Calendar Generation**:
- Creates month grids with proper week alignment
- Marks diary dates for visual highlighting
- Handles empty cells for proper grid layout

### Styling Architecture

- SCSS-based styling with color variables (`$color-primary: #ffb67e`)
- FONTPLUS web font integration for Japanese typography
- Fixed 390px width mobile-first design
- Responsive breakpoint at 390px for full-width display

### Component Structure

```
App.jsx (Main container)
├── Image container (Fixed position header)
├── Calendar container (Scrollable months)
│   └── Month sections
│       ├── Month title
│       ├── Calendar grid (7-column)
│       └── DebugScale (Optional debugging component)
└── Navigation bar (Fixed bottom controls)
```

## Important Implementation Details

### Auto-Scroll Mechanism
The auto-scroll feature uses `setInterval` with intelligent pause/resume:
- Automatically progresses through diary entries
- Detects manual scroll via `isAutoScrollingRef` flag
- Temporarily pauses on user interaction
- Resumes from current position after 500ms of inactivity

### Image Path Resolution
Images follow a specific naming convention:
- Format: `{day}-{monthShort}.jpeg` where monthShort is lowercase 3-letter abbreviation
- Example: `3-jan.jpeg` for January 3rd
- Located in `/src/image/` directory

### FONTPLUS Integration
Custom Japanese web fonts are loaded via FONTPLUS service. The script tag in `index.html` must remain intact for proper font rendering.

## Dependencies

- **Vite**: Build tool and dev server
- **React 19.1.1**: UI framework
- **sass-embedded**: SCSS compilation
- **@vitejs/plugin-react**: React support for Vite