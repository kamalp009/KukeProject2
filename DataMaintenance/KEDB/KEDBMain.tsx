import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import KEDBInputSection from "./components/KEDBInputSection";
import KEDBResultsSection from "./components/KEDBResultsSection";
import KEDBContentEditor from "./components/KEDBContentEditor";
import KEDBVersionModal from "./components/KEDBVersionModal";
import { KEDBApiProvider } from "./hooks/useKEDBApi";
import { KEDB } from "./types/kedb";
import "./styles/KEDB.module.css";

// Create a query client for KEDB
const kedbQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

export interface KEDBProps {
  className?: string;
  apiBaseUrl?: string;
}

type View = "main" | "results" | "editor";

const KEDBMain: React.FC<KEDBProps> = ({ 
  className = "",
  apiBaseUrl = "/api"
}) => {
  const [currentView, setCurrentView] = useState<View>("main");
  const [incidentDescription, setIncidentDescription] = useState("");
  const [selectedKEDB, setSelectedKEDB] = useState<KEDB | null>(null);
  const [searchResults, setSearchResults] = useState<KEDB[]>([]);
  const [showVersionModal, setShowVersionModal] = useState(false);

  const handleFindKEDBSuccess = (results: KEDB[]) => {
    setSearchResults(results);
    setCurrentView("results");
  };

  const handleGenerateKEDBSuccess = (kedb: KEDB) => {
    setSelectedKEDB(kedb);
    setCurrentView("editor");
  };

  const handleOpenKEDB = (kedb: KEDB) => {
    setSelectedKEDB(kedb);
    setCurrentView("editor");
  };

  const handleBackToResults = () => {
    setCurrentView("results");
    setSelectedKEDB(null);
  };

  const handleBackToMain = () => {
    setCurrentView("main");
    setSearchResults([]);
    setSelectedKEDB(null);
  };

  const handleKEDBUpdate = (updatedKEDB: KEDB) => {
    setSelectedKEDB(updatedKEDB);
  };

  return (
    <QueryClientProvider client={kedbQueryClient}>
      <KEDBApiProvider baseUrl={apiBaseUrl}>
        <div className={`kedb-container ${className}`}>
          {/* Header */}
          <div className="kedb-header mb-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-bold text-gray-900">
                  KEDB Draft Generator
                </h1>
                <button
                  onClick={() => setShowVersionModal(true)}
                  className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-full hover:bg-blue-100 transition-colors"
                >
                  v1.0.0
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="kedb-content">
            {/* Always show input section */}
            <KEDBInputSection
              incidentDescription={incidentDescription}
              onIncidentDescriptionChange={setIncidentDescription}
              onFindKEDBSuccess={handleFindKEDBSuccess}
              onGenerateKEDBSuccess={handleGenerateKEDBSuccess}
            />

            {/* Conditional views below input */}
            {currentView === "results" && (
              <div className="mt-8">
                <KEDBResultsSection
                  results={searchResults}
                  onOpenKEDB={handleOpenKEDB}
                  onBack={handleBackToMain}
                />
              </div>
            )}

            {currentView === "editor" && selectedKEDB && (
              <div className="mt-8">
                <KEDBContentEditor
                  kedb={selectedKEDB}
                  onBack={searchResults.length > 0 ? handleBackToResults : handleBackToMain}
                  onKEDBUpdate={handleKEDBUpdate}
                />
              </div>
            )}
          </div>

          {/* Version Modal */}
          {showVersionModal && (
            <KEDBVersionModal
              isOpen={showVersionModal}
              onClose={() => setShowVersionModal(false)}
            />
          )}
        </div>
      </KEDBApiProvider>
    </QueryClientProvider>
  );
};

export default KEDBMain;