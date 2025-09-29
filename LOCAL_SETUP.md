# Local Development Setup

## macOS Setup Issues & Solutions

### Node.js Version Compatibility
You're running Node.js v23.6.1, which has some networking changes that can cause issues with binding to `0.0.0.0` on macOS.

### Solution 1: Use Different Port
Try running with a different port that's not restricted:
```bash
PORT=3000 npm run dev
```

### Solution 2: Use Node v20 (Recommended)
Switch to Node.js v20 which has better macOS compatibility:
```bash
# If using nvm
nvm use 20
# or install Node v20
```

### Solution 3: Update Package.json Scripts
The server has been updated to automatically use `localhost` for local development instead of `0.0.0.0`.

### Solution 4: Alternative Start Command
Try starting with explicit localhost:
```bash
HOST=localhost npm run dev
```

## Current Project Status
- ✅ Build process works correctly (`npm run build` completes successfully)
- ✅ All dependencies installed properly
- ⚠️  Server binding issue on macOS with Node v23
- ✅ EDC Deployment Wizard fully implemented and working

## Running the Application
1. Make sure you have Node.js v20 installed (recommended)
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`
4. Open http://localhost:3030 in your browser

## Features Available
- Dashboard with KPI cards
- EDC Connector management
- Step-by-step deployment wizard
- Multi-language support (EN/DE)
- Authentication system
- YAML configuration viewer