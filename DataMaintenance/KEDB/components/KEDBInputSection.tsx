import React from "react";
import { Search, Wand2, Loader2 } from "lucide-react";
import { useSearchKEDBs, useGenerateKEDB } from "../hooks/useKEDBApi";
import { KEDB } from "../types/kedb";

interface KEDBInputSectionProps {
  incidentDescription: string;
  onIncidentDescriptionChange: (value: string) => void;
  onFindKEDBSuccess: (results: KEDB[]) => void;
  onGenerateKEDBSuccess: (kedb: KEDB) => void;
}

const KEDBInputSection: React.FC<KEDBInputSectionProps> = ({
  incidentDescription,
  onIncidentDescriptionChange,
  onFindKEDBSuccess,
  onGenerateKEDBSuccess,
}) => {
  const searchMutation = useSearchKEDBs();
  const generateMutation = useGenerateKEDB();

  const hasText = incidentDescription.trim().length > 0;

  const showToast = (title: string, description: string, type: "success" | "error" = "success") => {
    // Simple console logging for now - you can integrate with your existing toast system
    console.log(`${type.toUpperCase()}: ${title} - ${description}`);
  };

  const handleFindKEDB = () => {
    if (!hasText) {
      showToast("Error", "Please enter an incident description before searching.", "error");
      return;
    }

    searchMutation.mutate(incidentDescription, {
      onSuccess: (data) => {
        const results = data.data || [];
        const count = data.count || results.length || 0;
        
        onFindKEDBSuccess(results);
        showToast("Success", `Found ${count} suggested KEDBs`);
      },
      onError: (error) => {
        showToast("Error", error.message || "Failed to search KEDBs. Please try again.", "error");
      },
    });
  };

  const handleGenerateKEDB = () => {
    if (!hasText) {
      showToast("Error", "Please enter an incident description before generating.", "error");
      return;
    }

    generateMutation.mutate(incidentDescription, {
      onSuccess: (data) => {
        const kedb = data.data;
        
        onGenerateKEDBSuccess(kedb);
        showToast("Success", "KEDB generated successfully");
      },
      onError: (error) => {
        showToast("Error", error.message || "Failed to generate KEDB. Please try again.", "error");
      },
    });
  };

  const isLoading = searchMutation.isPending || generateMutation.isPending;

  return (
    <div className="kedb-input-section space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <label 
                htmlFor="incident-description" 
                className="block text-sm font-medium text-gray-700 mb-3"
              >
                Enter Incident Short Description
              </label>
              <textarea
                id="incident-description"
                rows={4}
                className="w-full px-3 py-3 border border-gray-300 rounded-md text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Enter detailed incident description for better KEDB matching..."
                value={incidentDescription}
                onChange={(e) => onIncidentDescriptionChange(e.target.value)}
                disabled={isLoading}
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleFindKEDB}
                disabled={!hasText || isLoading}
                className="inline-flex items-center px-6 py-2.5 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {searchMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Search className="mr-2 h-4 w-4" />
                )}
                Find KEDB
              </button>
              <button
                onClick={handleGenerateKEDB}
                disabled={!hasText || isLoading}
                className="inline-flex items-center px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {generateMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="mr-2 h-4 w-4" />
                )}
                Generate KEDB
              </button>
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="p-8 text-center border-t border-gray-200">
            <div className="inline-flex items-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <span className="text-gray-600">
                {searchMutation.isPending ? "Searching KEDBs..." : "Generating KEDB..."}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default KEDBInputSection;