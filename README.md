# Hospital Management System

A modern, responsive hospital management system built with React, TypeScript, and Tailwind CSS.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server (accessible on LAN)
npm run dev
```

## LAN Access Setup

The development server is configured to accept connections from other computers on your network.

### Starting the Server

```bash
npm run dev
```

The server will start and display the LAN IP address:

```
  LAN: http://192.168.1.100:5173
  Local: http://localhost:5173
```

### For Other Computers to Connect

1. Ensure all devices are on the same WiFi/LAN network
2. Find the host computer's IP address:
   - **Windows**: `ipconfig` in cmd
   - **Mac/Linux**: `ifconfig` or `ip addr` in terminal
3. Other users access via: `http://[HOST_IP]:5173`

### Firewall Settings (if needed)

Ensure port 5173 is allowed through your firewall:

**Windows:**
```powershell
netsh advfirewall firewall add rule name="Hospital System" dir=in action=allow protocol=TCP localport=5173
```

**Mac:**
```bash
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /path/to/node
```

## Project Structure

```
src/
├── components/       # Reusable UI components
├── pages/            # Dashboard pages
├── context/          # React contexts
├── hooks/            # Custom hooks
├── utils/            # Utility functions
└── App.tsx           # Main app with routing
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with LAN access |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build |

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
VITE_API_BASE_URL=http://localhost:3000/api
VITE_HOSPITAL_NAME=Your Hospital Name
```

## Dashboards

- **Admin Dashboard** (`/dashboard`) - System administration
- **Doctor Dashboard** - Patient appointments and records
- **Patient Dashboard** - Medical reports and history
- **Receptionist Dashboard** - Patient check-in and queue management

## Technology Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS 4
- Framer Motion (animations)
- Recharts (charts)
- Lucide React (icons)
- React Router (navigation)

## Notes

- Currently uses mock data (no backend required)
- For production, set up a backend API and update `VITE_API_BASE_URL`
- Supports dark mode via system preference