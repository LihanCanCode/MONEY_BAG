# MoneyBag

MoneyBag is an end-to-end personal finance platform that combines real-time money management, AI-assisted transaction capture, rich analytics, and goal tracking in a single experience. The project ships a modern React dashboard backed by an Express API, MongoDB document store, Firebase authentication, and Gemini-powered automation.

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [API Overview](#api-overview)
- [Frontend Highlights](#frontend-highlights)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Features

### Financial Overview
- Interactive dashboards surface real-time balances, cash flow, and category spending heatmaps.
- Enhanced dashboard tabs bundle core workflows (budgets, goals, recurring, analytics, exports, transactions).

### Transaction Management
- Capture spend or income manually with rich metadata and satisfaction scoring.
- Process CSV and PDF exports for comprehensive record keeping.
- Parse natural language descriptions or receipt images via Gemini 2.5 Flash.

### Budget Management
- Create monthly or yearly budgets by category with customizable alert thresholds.
- Visualize status with circular and linear progress bars plus color-coded states (green, yellow, red).
- Review analytics comparing budget targets against actual spending and toggle budgets on/off without losing history.

### Financial Goals
- Define savings targets with priorities, deadlines, and ongoing contributions.
- Predict goal attainment using historical savings rates and real-time progress indicators.
- Celebrate completions with confetti animations and status tracking for on-track vs behind goals.

### Recurring Automation
- Schedule recurring income or expense entries with daily, weekly, monthly, or yearly cadence.
- Pause or resume recurring items, process due transactions on demand, and maintain detailed audit trails.

### Debt Tracking
- Monitor money owed to you versus obligations you need to settle.
- Capture dramatic persona tags (best friend, suspicious, sworn enemy) to add context to each lender or borrower.
- Adjust balances with add/subtract actions, resolve settled debts, and review running history with celebratory feedback.

### Split Bills
- Split shared expenses with friends using equal or custom amount distribution.
- Track unpaid, partially paid, fully paid, or treated shares with real-time summaries of what others owe you.
- Manage each split with inline settlement actions, edit/delete controls, and celebratory feedback when everything is settled.

### Analytics & Reporting
- Generate category breakdowns, trend charts, and spending heatmaps across day and time dimensions.
- Export branded PDF or CSV transaction reports, including summaries and detailed itemization.

### Security & Access
- Enforce Firebase Authentication across the SPA and verify ID tokens in the API layer.
- Scope all database operations by authenticated user and protect sensitive keys via environment variables.

---

## Architecture

The workspace uses a two-repo structure managed in a single monorepo-style directory. Frontend and backend run independently but communicate over REST with shared auth tokens.

```
Money-Bag - Copy/
├── README.md                # You are here
├── backend/                 # Node.js + Express API
│   ├── index.js             # App bootstrap & routing
│   ├── middleware/          # Firebase auth verification
│   └── src/
│       ├── transactions/    # CRUD, analytics, exports
│       ├── recurring/       # Recurring scheduler endpoints
│       ├── budgets/         # Budget models and routes
│       ├── goals/           # Goal logic and AI predictions
│       ├── analytics/       # Heatmaps, reports, metrics
│       ├── wallet/          # Wallet aggregates
│       ├── users/           # User profile endpoints
│       └── utils/           # Gemini helpers, shared tools
├── frontend/                # React + Vite single-page app
│   ├── src/
│   │   ├── pages/           # Dashboard, auth, enhanced views
│   │   ├── components/      # Charts, cards, skeletons, widgets
│   │   ├── context/         # Auth & theme providers
│   │   └── firebase/        # Client auth bootstrap
│   └── public/              # Static assets
└── docs                     # Guides such as budget & goals walkthroughs
```

---

## Tech Stack

| Layer | Technologies |
| --- | --- |
| Frontend | React 19, Vite 7, Tailwind CSS v4, Material UI, Framer Motion, Chart.js, Recharts, React Router |
| Backend | Node.js, Express 5, MongoDB with Mongoose 9, Firebase Admin, Multer, json2csv, PDFKit |
| AI & Automation | Google Gemini 2.5 Flash (text and vision models) |
| Auth | Firebase Authentication (web SDK + Admin SDK) |
| Tooling | ESLint 9, Nodemon, React Hot Toast |

---

## Getting Started

### Prerequisites

- Node.js 20 or later
- npm 10 or later
- MongoDB instance (Atlas cluster or local server)
- Firebase project with Web app credentials and service account key
- Google AI Studio project with a Gemini API key

### Installation

1. Clone the repository and install backend dependencies:
   ```bash
   cd backend
   npm install
   ```
2. Configure backend environment variables (see [Environment Variables](#environment-variables)).
3. Install frontend dependencies:
   ```bash
   cd ../frontend
   npm install
   ```
4. Configure frontend environment variables.

### Run the platform locally

Start MongoDB if it is not already running, then launch each server in its own terminal:

```bash
# Terminal 1 - backend
cd backend
npm run start:dev

# Terminal 2 - frontend
cd frontend
npm run dev
```

The API listens on the port defined in `PORT` (defaults to 5000). The Vite dev server uses port 5173 by default and must be whitelisted in the backend CORS configuration.

---

## Environment Variables

Create `.env` files in each package before running the app.

### Backend (`backend/.env`)

```
PORT=5000
DB_URL=mongodb://localhost:27017/moneybag
GEMINI_API_KEY=your_gemini_api_key_here
FIREBASE_PROJECT_ID=your_firebase_project_id
# Required when using a Firebase service account JSON key file
FIREBASE_CLIENT_EMAIL=service-account@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

> Tip: You can alternatively set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable to point to the downloaded service account key file for firebase-admin initialization.

### Frontend (`frontend/.env`)

```
VITE_API_BASE_URL=http://localhost:5000
VITE_FIREBASE_API_KEY=your_firebase_web_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

Commit the `.env` files to version control only if they contain non-sensitive placeholders.

---

## Available Scripts

### Backend

- `npm run start` – start the API with Node.
- `npm run start:dev` – start the API with Nodemon for live reload.

### Frontend

- `npm run dev` – start the Vite development server with hot module reload.
- `npm run build` – create a production build in `dist/`.
- `npm run preview` – serve the production build locally.
- `npm run lint` – run ESLint using the project configuration.

---

## API Overview

| Area | Method | Path | Description |
| --- | --- | --- | --- |
| Users | GET | `/api/users/profile` | Fetch the authenticated user profile. |
| Wallet | GET | `/api/wallet` | Retrieve wallet balances and aggregates. |
| Transactions | CRUD | `/api/transactions` | Manage expenses and income, support satisfaction scoring. |
| Recurring | POST | `/api/recurring/process` | Trigger processing of due recurring transactions. |
| Budgets | GET | `/api/budgets/analytics` | Compare budget targets against actual spending. |
| Goals | POST | `/api/goals/:id/contribute` | Contribute toward a financial goal. |
| Analytics | GET | `/api/analytics/heatmap` | Return day/time-based spending heatmap data. |
| Reports | GET | `/api/analytics/export/csv` | Download transactions as CSV or PDF documents. |

All endpoints require a valid Firebase ID token via the `Authorization: Bearer <token>` header. The backend validates tokens with the Firebase Admin SDK and scopes all data by the signed-in user ID.

---

## Frontend Highlights

- **Enhanced dashboard** with tabbed navigation for budgets, goals, recurring transactions, analytics, exports, and transaction management.
- **Responsive design** leveraging Tailwind CSS, custom theming, and dark-first styling.
- **Data visualizations** powered by Chart.js, Recharts, and bespoke components such as `BudgetChart`, `SpendingHeatmap`, and `AnimatedCounter`.
- **Progress feedback** through circular and linear indicators, confetti celebrations for goal completions, and contextual toasts for actions.
- **Debt Tracker** experience with dramatic labels, history timeline, and confetti-filled payoff celebrations.
- **State management** handled via React context providers for authentication and theme preferences.

---

## Roadmap

Planned enhancements drawn from internal guides:

1. Multi-threshold budget alerts and email notifications.
2. Milestone celebrations for goals (25/50/75 percent progress).
3. Budget templates and rollover logic for unused funds.
4. Shared goals and collaborative budgeting.
5. Additional export formats and scheduled reporting.

Refer to `BUDGET_AND_GOALS_GUIDE.md`, `NEW_FEATURES_GUIDE.md`, and `IMPLEMENTATION_CHECKLIST.md` for deeper implementation notes.


## License

This project is released under the ISC License. See the `LICENSE` field in package manifests for details.
