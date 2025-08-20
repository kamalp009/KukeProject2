import React, { useState } from 'react';
import { KEDB } from '../index';

// Example integration of KEDB component into your existing app
function App() {
  const [activeMenu, setActiveMenu] = useState<string>('dashboard');

  const renderContent = () => {
    switch (activeMenu) {
      case 'kedb':
        return (
          <div className="content-area">
            <KEDB 
              className="p-6"
              apiBaseUrl="/api" // Adjust this to match your backend API base URL
            />
          </div>
        );
      case 'dashboard':
        return (
          <div className="content-area">
            <h1>Dashboard</h1>
            <p>Your existing dashboard content...</p>
          </div>
        );
      case 'reports':
        return (
          <div className="content-area">
            <h1>Reports</h1>
            <p>Your existing reports content...</p>
          </div>
        );
      default:
        return (
          <div className="content-area">
            <h1>Welcome</h1>
            <p>Select a menu item from the sidebar.</p>
          </div>
        );
    }
  };

  return (
    <div className="app-container">
      {/* Your existing header/navbar */}
      <header className="app-header">
        <h1>Your Application Name</h1>
      </header>

      <div className="app-layout">
        {/* Your existing sidebar/navigation */}
        <nav className="sidebar">
          <ul>
            <li>
              <button 
                onClick={() => setActiveMenu('dashboard')}
                className={`nav-button ${activeMenu === 'dashboard' ? 'active' : ''}`}
              >
                Dashboard
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveMenu('reports')}
                className={`nav-button ${activeMenu === 'reports' ? 'active' : ''}`}
              >
                Reports
              </button>
            </li>
            {/* Data Maintenance Section */}
            <li className="nav-section">
              <h3>Data Maintenance</h3>
              <ul>
                <li>
                  <button 
                    onClick={() => setActiveMenu('kedb')}
                    className={`nav-button ${activeMenu === 'kedb' ? 'active' : ''}`}
                  >
                    KEDB Management
                  </button>
                </li>
                {/* Add other data maintenance items here */}
              </ul>
            </li>
          </ul>
        </nav>

        {/* Main content area where KEDB will render */}
        <main className="main-content">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default App;

// Example CSS to go with this integration
const exampleCSS = `
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-header {
  background: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
  padding: 1rem 2rem;
}

.app-layout {
  display: flex;
  flex: 1;
}

.sidebar {
  width: 250px;
  background: #ffffff;
  border-right: 1px solid #dee2e6;
  padding: 1rem;
}

.nav-button {
  width: 100%;
  padding: 0.75rem 1rem;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
  border-radius: 0.375rem;
  margin-bottom: 0.25rem;
  transition: background-color 0.15s ease;
}

.nav-button:hover {
  background-color: #f8f9fa;
}

.nav-button.active {
  background-color: #e3f2fd;
  color: #1976d2;
}

.nav-section {
  margin-top: 2rem;
}

.nav-section h3 {
  font-size: 0.875rem;
  font-weight: 600;
  color: #6c757d;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.main-content {
  flex: 1;
  background: #f8f9fa;
}

.content-area {
  padding: 2rem;
}

/* KEDB specific styling to integrate with your theme */
.kedb-main-container {
  background: #ffffff;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
`;