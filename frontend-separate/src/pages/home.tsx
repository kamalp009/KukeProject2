import { useState } from "react";
import AppHeader from "@/components/app-header";
import InputSection from "@/components/input-section";
import ResultsSection from "@/components/results-section";
import ContentEditor from "@/components/content-editor";
import VersionModal from "@/components/version-modal";

interface KEDB {
  id: string;
  title: string;
  description: string;
  content: string;
  matchPercentage?: number;
  rank?: number;
  recommended?: boolean;
}

type View = "main" | "results" | "editor";

export default function Home() {
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

  return (
    <div className="font-inter bg-background min-h-screen" data-testid="app-container">
      <AppHeader 
        onShowVersionModal={() => setShowVersionModal(true)} 
        data-testid="app-header"
      />
      
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Always show input section */}
        <InputSection
          incidentDescription={incidentDescription}
          onIncidentDescriptionChange={setIncidentDescription}
          onFindKEDBSuccess={handleFindKEDBSuccess}
          onGenerateKEDBSuccess={handleGenerateKEDBSuccess}
          data-testid="input-section"
        />
        
        {/* Show results below input section */}
        {currentView === "results" && (
          <div className="mt-8">
            <ResultsSection
              results={searchResults}
              onOpenKEDB={handleOpenKEDB}
              onBack={handleBackToMain}
              data-testid="results-section"
            />
          </div>
        )}
        
        {/* Show editor below input section */}
        {currentView === "editor" && selectedKEDB && (
          <div className="mt-8">
            <ContentEditor
              kedb={selectedKEDB}
              onBack={currentView === "editor" && searchResults.length > 0 ? handleBackToResults : handleBackToMain}
              onKEDBUpdate={setSelectedKEDB}
              data-testid="content-editor"
            />
          </div>
        )}
      </main>

      <VersionModal
        isOpen={showVersionModal}
        onClose={() => setShowVersionModal(false)}
        data-testid="version-modal"
      />
    </div>
  );
}
