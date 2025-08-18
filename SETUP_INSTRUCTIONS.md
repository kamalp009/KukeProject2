# KEDB Draft Generator - Local Setup Instructions

## Prerequisites

Make sure you have the following installed on your local machine:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **Git** (to clone the repository)

## Project Structure

```
kedb-draft-generator/
├── frontend-separate/    # React Frontend (Port 3000)
└── backend-separate/     # Express Backend (Port 8000)
```

## Setup Instructions

### Step 1: Download the Project

You can either:
- Download as ZIP and extract
- Or clone if you have a Git repository

### Step 2: Install Dependencies

Open two terminal windows/tabs in your project root directory.

#### Terminal 1 - Backend Setup
```bash
cd backend-separate
npm install
```

#### Terminal 2 - Frontend Setup  
```bash
cd frontend-separate
npm install
# If you encounter styling issues, also run:
npm install @tailwindcss/typography tailwindcss-animate
```

### Step 3: Start the Applications

#### Terminal 1 - Start Backend (Port 8000)
```bash
cd backend-separate
npm run dev
```

You should see:
```
🚀 Backend server running on port 8000
```

#### Terminal 2 - Start Frontend (Port 3000)
```bash
cd frontend-separate  
npm run dev
```

You should see:
```
Local:   http://localhost:3000/
```

### Step 4: Access the Application

Open your web browser and navigate to:
```
http://localhost:3000
```

The frontend will automatically proxy API requests to the backend running on port 8000.

## Verification

1. **Backend Health Check**: Visit `http://localhost:8000/api/kedbs/search` (should show CORS error - this is normal)
2. **Frontend**: Visit `http://localhost:3000` and you should see the KEDB Draft Generator interface
3. **Full Functionality**: Try searching for "performance" or generating a new KEDB

## Available Scripts

### Backend (`backend-separate/`)
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server

### Frontend (`frontend-separate/`)
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Features Available

✅ **Find KEDB**: Search existing KEDBs based on incident description  
✅ **Generate KEDB**: AI-powered KEDB generation  
✅ **Content Editor**: Edit and update KEDB documents  
✅ **Download**: Export KEDB content as text files  
✅ **Version Info**: Click v1.0.0 to see features and tech stack  

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Kill process on port 3000
   npx kill-port 3000
   
   # Kill process on port 8000  
   npx kill-port 8000
   ```

2. **Node Modules Issues**
   ```bash
   # Clear node_modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **CORS Errors**
   - Make sure backend is running on port 8000
   - Frontend proxy is configured to point to localhost:8000

4. **API Not Working**
   - Verify backend is running and showing "Backend server running on port 8000"
   - Check browser network tab for failed requests
   - Ensure frontend is accessing localhost:3000

5. **UI Styling Issues (buttons stacked vertically, missing styles)**
   - Ensure Tailwind CSS is configured correctly
   - Run: `cd frontend-separate && npm install @tailwindcss/typography tailwindcss-animate`
   - Clear browser cache and refresh the page
   - Check that frontend build process completed without errors

### File Structure Verification

Your local setup should look like this:

```
your-project-folder/
├── backend-separate/
│   ├── src/
│   │   ├── index.ts
│   │   ├── routes.ts
│   │   ├── storage.ts
│   │   └── schema.ts
│   ├── package.json
│   └── tsconfig.json
├── frontend-separate/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── pages/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── index.html
└── shared/
    └── schema.ts
```

## Development Notes

- **Hot Reload**: Both frontend and backend support hot reload during development
- **API Endpoints**: All API routes are available at `/api/*` and automatically proxied
- **Mock Data**: Backend uses in-memory storage with realistic KEDB examples
- **TypeScript**: Both frontend and backend are fully typed with TypeScript

## Production Deployment

For production deployment:

1. **Build Frontend**:
   ```bash
   cd frontend-separate
   npm run build
   ```

2. **Build Backend**:
   ```bash
   cd backend-separate  
   npm run build
   ```

3. **Deploy**: Use the `dist/` folders for deployment to your preferred hosting service

---

**Need Help?** Check the console logs in both terminals for any error messages, and ensure both servers are running before testing the application.