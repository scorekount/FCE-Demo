# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Fan Controlled Esports (FCE) Demo - Technical Overview

## Project Context
**Company**: Ouroboro Labs (ScoreKount)  
**Innovation**: Real-time viewer voting to control game parameters during live streams/esports and casual matches alike (inspired by Crowd Control; with much more detailed controls and democratized voting systems)
**Pivot**: From traditional esports questing platform to Fan Controlled Esports - fully focused on 'blue ocean' oppurtunity
**Demo**: This particular folder is/will be a working, sort of a, Minimal Viable Product (MVP) demo for the ScoreKount's Fan Control Esports functionality

## Demo Architecture

### Tech Stack
- **Frontend**: React + TypeScript, Socket.io-client
- **Backend**: Node.js + Express + Socket.io  
- **Game Control**: AutoHotkey (sends console commands to CS2)
- **Current State**: Functional voting system, UI complete, game integration via hotkeys

### How It Works
Viewers Vote → Backend Aggregates → Winner Determined → Effect Queued → AHK Executes in CS2


This is a Fan Controlled Esports (FCE) demo application with three main components:

1. **Frontend** (`frontend/`): React/TypeScript SPA with Socket.IO client for real-time voting
2. **Backend** (`backend/`): Node.js/Express server with Socket.IO for WebSocket communication
3. **Game Controller** (`game-controller/`): AutoHotkey script that executes effects in Counter-Strike 2

The system allows viewers to vote on game effects or purchase them with points. Effects are executed in Counter-Strike 2 via console commands sent through the AutoHotkey controller.

### Communication Flow
- Frontend ↔ Backend: Socket.IO WebSocket connection (port 3001)
- Backend ↔ Game Controller: Raw WebSocket connection (port 8081)
- Game Controller → CS2: AutoHotkey console commands

## Development Commands

### Frontend (React/TypeScript)
```bash
cd frontend
npm start          # Development server (port 3000)
npm run build      # Production build
npm test           # Run Jest tests
npm run eject      # Eject from Create React App
```

### Backend (Node.js)
```bash
cd backend
npm start          # Production server
npm run dev        # Development with nodemon
```

### Game Controller
- Run `cs2-controller.ahk` directly with AutoHotkey
- Requires WebSocket.ahk and JSON.ahk libraries in same directory

## Key Components

### Frontend Components
- `VotingInterface`: Main viewer interface for voting and purchasing effects
- `StreamerDashboard`: Analytics and control panel for streamers
- `StreamPreview`: Simulated game stream display

### Backend Features
- Real-time voting system with 30-second duration
- Points-based economy (users start with 500 points)
- Effect queue management
- Viewer analytics and statistics
- WebSocket bridge to game controller

### Effect Categories
- **Weapons**: pistol_only, awp_madness, knife_fight
- **Movement**: speed_boost, slow_motion, bunny_hop
- **Vision**: night_mode, disco_mode, upside_down
- **Chaos**: friendly_fire, one_hp, randomize_teams

## Testing
Frontend uses Jest with React Testing Library. Run tests with `npm test` in the frontend directory.

## Dependencies

### Frontend
- React 19 with TypeScript
- Socket.IO client for real-time communication
- React Router for navigation
- Testing Library suite

### Backend
- Express.js web framework
- Socket.IO for WebSocket server
- CORS middleware
- ws library for raw WebSocket (game controller)

### Game Controller
- AutoHotkey with WebSocket and JSON libraries
- Connects to CS2 via console commands
- Requires `sv_cheats 1` for many effects

### 4. **Business Case** (1 minute)
- Show revenue counter incrementing
- "Each vote generates microtransactions"
- "Crowd Control makes $100M+ annually - we're the evolution"
- "Already tested with top esports teams - 4.8x higher retention"

## Key Code Decisions

### Why Socket.io?
- Real-time bidirectional communication
- Handles reconnections automatically
- Scales to thousands of concurrent users

### Why AutoHotkey for Game Control?
- Non-invasive (no game file modifications)
- Works with any game that has console commands
- Quick to prototype and demonstrate

### Why TypeScript?
- Type safety for complex voting data structures
- Better IDE support for team development
- Industry standard for production React apps

## Critical Technical Details

### Backend (`server.js`)
- Maintains voting state in memory (no DB for demo)
- 30-second voting windows
- Broadcasts to all connected clients
- Tracks points/revenue for gamification

### Frontend (`VotingInterface.tsx`)
- Each browser tab gets unique ID via localStorage
- Real-time vote percentage updates
- Animated UI for engagement
- Effect queue shows triggered actions

### Game Controller (`cs2-controller.ahk`)
- F1-F6 hotkeys for manual effect triggering
- Only uses verified CS2 console commands
- Automatic timers to reset effects

## Demo Requirements
1. **CS2 Setup**: Local server, console enabled, `sv_cheats 1`
2. **Multiple Browsers**: Chrome, Firefox, Edge (for different voter IDs)
3. **Both Servers Running**: Backend (port 3001) and Frontend (port 3000)

## The Pitch Crescendo
"We're not just adding features to esports - we're transforming viewers from passengers to pilots. Every match becomes unique, every moment unpredictable. This is the future of competitive gaming entertainment."

## Repository Structure
```
fan-controlled-esports/
├── frontend/          # React voting interface
├── backend/           # WebSocket server
├── game-controller/   # AutoHotkey scripts
└── README.md         # Setup instructions
```