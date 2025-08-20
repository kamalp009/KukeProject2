# KEDB Integration Guide

This folder contains the complete KEDB (Knowledge Error Database) Draft Generator component that can be seamlessly integrated into your existing React TypeScript project.

## Integration Steps

### 1. Copy the KEDB folder to your project
Place the entire `DataMaintenance/KEDB` folder into your existing project structure.

### 2. Install required dependencies
Add these packages to your project if not already installed:
```bash
npm install @tanstack/react-query lucide-react
```

### 3. Import and use the KEDB component in your App.tsx

```typescript
import React, { useState } from 'react';
import { KEDB } from './DataMaintenance/KEDB';

function App() {
  const [activeMenu, setActiveMenu] = useState('');

  const renderContent = () => {
    switch (activeMenu) {
      case 'kedb':
        return (
          <KEDB 
            className="kedb-main-container"
            apiBaseUrl="/api" // Adjust to your backend API base URL
          />
        );
      default:
        return <div>Select a menu item</div>;
    }
  };

  return (
    <div className="app">
      <nav>
        <button onClick={() => setActiveMenu('kedb')}>
          KEDB Management
        </button>
        {/* Your other menu items */}
      </nav>
      
      <main>
        {renderContent()}
      </main>
    </div>
  );
}

export default App;
```

### 4. Configure your backend API endpoints
Ensure your backend has these endpoints:
- `POST /api/kedbs/search` - For searching KEDBs
- `POST /api/kedbs/generate` - For generating new KEDBs  
- `PUT /api/kedbs/:id` - For updating KEDBs (optional)

Request format:
```json
{
  "incidentDescription": "Your incident description here"
}
```

### 5. Styling Integration
The component uses scoped CSS classes to avoid conflicts with your existing styles. The main container has the class `kedb-container` and all styles are prefixed to prevent conflicts.

## Component Props

### KEDBProps
```typescript
interface KEDBProps {
  className?: string;        // Additional CSS classes
  apiBaseUrl?: string;       // Base URL for API calls (default: "/api")
}
```

## Features Included

- ✅ **Smart Search**: Find existing KEDBs based on incident descriptions
- ✅ **AI Generation**: Generate new KEDB drafts from incident descriptions  
- ✅ **Content Editor**: Edit KEDB title and content with real-time updates
- ✅ **Download**: Export KEDB content as text files
- ✅ **Version Modal**: Display feature information and tech stack
- ✅ **Responsive Design**: Works on all screen sizes
- ✅ **Loading States**: Proper loading indicators for all operations
- ✅ **Error Handling**: Graceful error handling with user feedback

## File Structure

```
DataMaintenance/KEDB/
├── index.ts                      # Main export
├── KEDBMain.tsx                  # Main component
├── README.md                     # This file
├── types/
│   └── kedb.ts                  # TypeScript interfaces
├── hooks/
│   └── useKEDBApi.tsx           # API hooks and context
├── components/
│   ├── KEDBInputSection.tsx     # Input form component
│   ├── KEDBResultsSection.tsx   # Search results display
│   ├── KEDBContentEditor.tsx    # Content editing interface
│   └── KEDBVersionModal.tsx     # Version information modal
└── styles/
    └── KEDB.module.css          # Scoped CSS styles
```

## Customization

### API Integration
Modify the `useKEDBApi.tsx` file to match your backend API response format.

### Styling
Edit `KEDB.module.css` to match your design system colors and spacing.

### Toast Notifications
Replace the console.log statements in components with your existing toast/notification system.

## Example Backend Response Format

### Search Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "KEDB001",
      "title": "Server Performance Issue",
      "description": "High CPU usage causing slow response",
      "content": "Step 1: Check CPU usage...",
      "matchPercentage": 85,
      "rank": 1,
      "recommended": true
    }
  ],
  "count": 1
}
```

### Generate Response:
```json
{
  "success": true,
  "data": {
    "id": "KEDB002", 
    "title": "Generated KEDB Title",
    "description": "Generated description",
    "content": "Generated content with steps...",
    "createdAt": "2025-01-01T00:00:00Z"
  }
}
```

## Support

The component is designed to work independently within your existing project structure without interfering with your current styling or functionality.