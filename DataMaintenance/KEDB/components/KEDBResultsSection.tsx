import React from "react";
import { ArrowLeft, Star } from "lucide-react";
import { KEDB } from "../types/kedb";

interface KEDBResultsSectionProps {
  results: KEDB[];
  onOpenKEDB: (kedb: KEDB) => void;
  onBack: () => void;
}

const KEDBResultsSection: React.FC<KEDBResultsSectionProps> = ({ 
  results, 
  onOpenKEDB, 
  onBack 
}) => {
  const recommendedCount = results.filter(kedb => kedb.recommended).length;

  return (
    <div className="kedb-results-section">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Search
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">
            Suggested KEDB's (<span className="text-blue-600">{results.length}</span> found)
          </h2>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            {recommendedCount > 0 && (
              <>
                <span className="text-green-600 font-medium">
                  {recommendedCount} recommended
                </span>
                <span>•</span>
              </>
            )}
            <span>Ranked by relevance score</span>
          </div>
        </div>
        
        <div className="divide-y divide-gray-200">
          {results.map((kedb, index) => (
            <div 
              key={kedb.id} 
              className="p-6 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-sm font-medium text-gray-500">
                      {index + 1}.
                    </span>
                    <button 
                      className="text-blue-600 hover:text-blue-700 font-medium"
                      onClick={() => onOpenKEDB(kedb)}
                    >
                      {kedb.id}
                    </button>
                    {kedb.recommended && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <Star className="mr-1 h-3 w-3" />
                        Recommended
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-medium text-gray-900 mb-2 line-clamp-2">
                    {kedb.title}
                  </h3>
                  
                  <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                    {kedb.description}
                  </p>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    {kedb.matchPercentage && (
                      <span>Match: {kedb.matchPercentage}%</span>
                    )}
                    {kedb.rank && (
                      <span>Rank: #{kedb.rank}</span>
                    )}
                  </div>
                </div>
                
                <div className="ml-6 flex-shrink-0">
                  <button
                    onClick={() => onOpenKEDB(kedb)}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Open
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default KEDBResultsSection;