# KEDB Draft Generator

A React TypeScript application with separate frontend and backend for managing Knowledge Error Database (KEDB) documents.

## Project Structure

```
├── frontend-separate/          # React Frontend Application
│   ├── src/
│   │   ├── components/        # UI Components
│   │   │   ├── ui/           # Shadcn UI Components
│   │   │   ├── app-header.tsx
│   │   │   ├── input-section.tsx
│   │   │   ├── results-section.tsx
│   │   │   ├── content-editor.tsx
│   │   │   └── version-modal.tsx
│   │   ├── hooks/            # Custom React Hooks
│   │   │   ├── use-kedb.ts
│   │   │   ├── use-toast.ts
│   │   │   └── use-mobile.tsx
│   │   ├── lib/              # Utilities
│   │   │   ├── utils.ts
│   │   │   ├── api.ts
│   │   │   └── queryClient.ts
│   │   ├── pages/            # Page Components
│   │   │   ├── home.tsx
│   │   │   └── not-found.tsx
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── components.json
│
├── backend-separate/           # Express Backend API
│   ├── src/
│   │   ├── index.ts          # Server entry point
│   │   ├── routes.ts         # API routes
│   │   ├── storage.ts        # Data storage layer
│   │   └── schema.ts         # Data schemas and types
│   ├── package.json
│   └── tsconfig.json
│
├── shared/                     # Shared types and schemas
│   └── schema.ts
│
└── client/                     # Current integrated version (existing)
    └── ...

```

## Features

### ✅ Fixed View Structure
- **Input section always visible**: The incident description input and buttons remain on screen
- **Results appear below**: Search results display underneath the input section  
- **Editor appears below**: Content editor opens below the input section
- **Proper navigation**: Back buttons correctly navigate between views

### ✅ Core Functionality
- **Find KEDB**: Search existing KEDBs based on incident description
- **Generate KEDB**: AI-powered generation of new KEDB documents
- **Content Editor**: Edit KEDB titles and content with live updates
- **Download**: Export KEDB content as text files
- **Version Info**: Modal showing v1.0.0 features and tech stack

### ✅ Error Handling
- Empty input validation for both buttons
- Loading states during API calls
- Toast notifications for success/error feedback
- Comprehensive error messages

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for development and building
- **Wouter** for routing
- **TanStack Query** for API state management
- **Radix UI + shadcn/ui** for components
- **Tailwind CSS** for styling
- **React Hook Form + Zod** for form validation

### Backend
- **Express.js** with TypeScript
- **Zod** for request validation
- **In-memory storage** with mock KEDB data
- **RESTful API** design

## Installation & Setup

### Option 1: Separate Frontend & Backend

#### Backend Setup
```bash
cd backend-separate
npm install
npm run dev    # Runs on port 5001
```

#### Frontend Setup  
```bash
cd frontend-separate
npm install
npm run dev    # Runs on port 3000, proxies API to 5001
```

### Option 2: Current Integrated Version
```bash
npm run dev    # Runs both frontend and backend together
```

## API Endpoints

- `POST /api/kedbs/search` - Search KEDBs
- `POST /api/kedbs/generate` - Generate new KEDB
- `GET /api/kedbs/:id` - Get specific KEDB
- `PUT /api/kedbs/:id` - Update KEDB
- `GET /api/kedbs/:id/download` - Download KEDB content

## Usage

1. **Enter incident description** in the text area
2. **Click "Find KEDB"** to search existing KEDBs
3. **Click "Generate KEDB"** to create a new AI-generated KEDB
4. **View results** below the input section
5. **Click "Open"** on any KEDB to edit it
6. **Use "Download"** button to export content
7. **Click version link** for feature information

## Recent Changes

- ✅ Fixed view replacement issue - input section now stays visible
- ✅ Created separate frontend and backend folder structures
- ✅ Added proper package.json files for each part
- ✅ Implemented comprehensive error handling
- ✅ Enhanced UI with proper navigation flow