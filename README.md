# 🎲 Intelligent Lottery Predictor

An advanced, AI-powered lottery number generator and prediction system built with Next.js, React, and TypeScript. Features sophisticated prediction algorithms, comprehensive history tracking, and automatic synchronization with official lottery results.

## 📸 Screenshots

### Landing Page

![Landing Page](./public/images/Screenshot%202026-01-02%20233020.png)

### Play Page

![Play Page](./public/images/Screenshot%202026-01-02%20233011.png)

### Generate Page with Matches

![Generate Page with Matches](./public/images/Screenshot%202026-01-02%20233003.png)

### Generate Page with No Matches

![Generate Page with No Matches](./public/images/Screenshot%202026-01-02%20233822.png)

### History Page

![History Page](./public/images/Screenshot%202026-01-02%20233904.png)

### Settings Page

![Settings Page](./public/images/Screenshot%202026-01-02%20233912.png)

### Info Page

![Info Page](./public/images/Screenshot%202026-01-02%20233921.png)

### Mobile View

![Mobile View](./public/images/Screenshot%202026-01-02%20233928.png)

## ✨ Features

### 🎯 Core Functionality

- **Smart Number Generation**: Generate random lottery numbers (1-99) with intelligent selection
- **AI-Powered Predictions**: Advanced prediction algorithm using:
  - Exponential decay recency analysis
  - Frequency and gap analysis
  - Monte Carlo simulation
  - Pair frequency analysis
  - Range distribution optimization
- **Auto Predict**: One-click AI prediction based on historical data
- **Manual Selection**: Choose your own numbers with an intuitive interface

### 📊 History & Analytics

- **Complete History Tracking**: View all generated and predicted numbers
- **Match Statistics**: Track prediction accuracy with detailed statistics
  - Total predictions
  - Average matches
  - Accuracy percentage
  - Perfect matches count
- **Pagination**: Efficient browsing through history records
- **Bulk Operations**: Select and delete multiple records at once

### 🔄 Data Management

- **Automatic Sync**: Sync with official lottery results from external sources
- **Customizable Sync Period**: Select sync range from 1 week to 51 years
- **Export/Import**: Backup and restore your history data in JSON format
- **Data Validation**: Ensures data integrity on import

### 🎨 User Experience

- **Modern UI**: Beautiful, responsive design with dark mode support
- **Confetti Celebrations**: Visual feedback when numbers match
- **Sound Effects**: Celebratory sounds for wins, with mute functionality
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Fixed Sidebar Navigation**: Easy access to all features

### ⚙️ Settings & Configuration

- **Sound Controls**: Toggle sound effects on/off
- **Custom Sync URL**: Configure lottery data source
- **Data Management**: Export, import, and sync lottery results

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (latest version)
- Node.js 18+ (if not using Bun's built-in Node.js)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd lottery-generator
   ```

2. **Install dependencies**

   ```bash
   bun install
   ```

3. **Run the development server**

   ```bash
   bun run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Building for Production

```bash
# Build the application
bun run build

# Start the production server
bun run start
```

## 📁 Project Structure

```
lottery-generator/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── api/               # API routes
│   │   │   ├── history/      # Fetch history
│   │   │   ├── predict/      # AI prediction endpoint
│   │   │   ├── save/         # Save generation
│   │   │   ├── delete/        # Delete records
│   │   │   ├── sync-lottery/ # Sync external data
│   │   │   ├── import/       # Import history
│   │   │   │   └── info/     # App information
│   │   ├── play/             # Number selection page
│   │   ├── generate/         # Results & statistics page
│   │   ├── history/          # History viewing page
│   │   ├── settings/         # Settings & data management
│   │   └── info/             # App information page
│   ├── components/           # React components
│   │   ├── Sidebar.tsx       # Navigation sidebar
│   │   ├── Logo.tsx          # App logo
│   │   └── LandingPage.tsx   # Landing page component
│   ├── contexts/             # React contexts
│   │   └── SoundContext.tsx  # Sound management
│   ├── hooks/                # Custom React hooks
│   │   ├── useHistory.ts     # History management
│   │   └── useNumberSelection.ts # Number selection logic
│   ├── lib/                  # Utility libraries
│   │   ├── generations.ts    # File I/O operations
│   │   ├── prediction.ts     # AI prediction algorithm
│   │   ├── utils.ts          # General utilities
│   │   └── numberColors.ts   # Number styling utilities
│   └── types/                # TypeScript types
│       └── generation.ts     # Data models
├── public/
│   ├── icons/                # App icons
│   └── sounds/               # Sound effects
├── data/                     # Generated data (gitignored)
│   └── generations.json      # History storage
└── package.json
```

## 🛠️ Technology Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **UI Library**: [React 18](https://react.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Package Manager**: [Bun](https://bun.sh/)
- **Effects**: [canvas-confetti](https://github.com/catdad/canvas-confetti)

## 📖 Usage Guide

### Generating Numbers

1. Navigate to the **Play** page
2. Either:
   - Click **Auto Predict** for AI-powered predictions
   - Manually select 5 numbers (1-99)
3. Click **Play** to generate results
4. View matches, statistics, and celebrate with confetti!

### Viewing History

1. Go to the **History** page
2. Browse through all past generations
3. See matched numbers highlighted
4. Delete individual or multiple records

### Syncing Lottery Results

1. Open **Settings**
2. Configure the sync URL (default: official lottery source)
3. Select the time range (1 week to 51 years)
4. Click **Sync Lottery Results**
5. View sync log and statistics

### Exporting/Importing Data

1. In **Settings**, scroll to **Export & Import**
2. **Export**: Download your history as JSON
3. **Import**: Upload a JSON file to restore history

## 🧠 Prediction Algorithm

The AI prediction system uses multiple advanced techniques:

1. **Exponential Decay Recency**: More recent draws have exponentially higher weight
2. **Frequency Analysis**: Tracks number appearance frequency
3. **Gap Analysis**: Identifies overdue numbers
4. **Pair Frequency**: Analyzes number combinations
5. **Range Distribution**: Ensures balanced number distribution
6. **Monte Carlo Simulation**: Generates and scores multiple candidate sets
7. **Sum Optimization**: Optimizes total sum based on historical patterns

## 🎨 Design Philosophy

- **Green/Emerald Theme**: Calming, professional color scheme
- **Gradient Backgrounds**: Subtle gradients for visual depth
- **Strong Borders**: Clear visual separation
- **Responsive**: Mobile-first design approach
- **Accessibility**: Proper contrast and semantic HTML

## 📝 API Endpoints

- `GET /api/history` - Fetch all generations
- `GET /api/predict` - Get AI-predicted numbers
- `POST /api/save` - Save a new generation
- `DELETE /api/delete` - Delete specific records
- `GET /api/sync-lottery` - Sync external lottery data
- `POST /api/import` - Import history data
- `GET /api/info` - Get app information

## 🔒 Data Storage

- History is stored locally in `data/generations.json`
- Data format:
  ```json
  {
    "id": "unique-id",
    "numbers": [1, 2, 3, 4, 5],
    "date": "ISO-date-string",
    "predictedNumbers": [1, 2, 3, 4, 5] // optional
  }
  ```

## 🚧 Development

### Running Linter

```bash
bun run lint
```

### Code Structure

The codebase follows best practices:

- **Modular**: Separated concerns with utilities, hooks, and components
- **Type-Safe**: Full TypeScript coverage
- **DRY**: Shared utilities and hooks reduce duplication
- **Maintainable**: Clear file structure and naming conventions

## 📄 License

This project is private and proprietary.

## 👤 Author

Built with ❤️ for intelligent lottery number prediction

---

**Note**: This application is for entertainment purposes only. Lottery outcomes are random, and no prediction system can guarantee wins.
