# SketchQuest 🎨

A real-time multiplayer drawing and guessing game built with React TypeScript, Node.js, and MySQL. Featuring beautiful Material-UI design.

## 🎯 Features

- 🎨 **UI** - Material-Design with smooth animations
- 👥 **Real-time Multiplayer** - Draw and guess with friends
- 💬 **Live Chat** - Communicate with other players
- 🏆 **Scoring System** - Competitive gameplay
- 🎯 **Power-ups** - Special abilities and bonuses
- 📱 **Responsive Design** - Works on all devices

## 🛠 Tech Stack

- **Frontend:** React 18, TypeScript, Material-UI (MUI), Vite
- **Backend:** Node.js, Express, TypeScript, Socket.io
- **Database:** MySQL with Knex.js
- **Styling:** Material-UI with custom theme

## 🎨 UI Features

- Modern gradient designs
- Smooth animations and transitions
- Responsive Material-UI components
- Custom color scheme and typography
- Interactive elements with hover effects

## 📦 Installation

### Prerequisites

- Node.js 16+
- MySQL 8.0+

### Setup Instructions

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/SketchQuest.git
cd SketchQuest

# 2. Setup Backend
cd server
npm install

# Configure database in server/knexfile.ts
# Then run migrations:
npm run migrate
npm run seed
npm run dev

# 3. Setup Frontend (in new terminal)
cd ../client
npm install
npm run dev

# 4. Access the application
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
```
