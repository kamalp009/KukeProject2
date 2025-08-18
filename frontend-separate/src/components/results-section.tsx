import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Star } from "lucide-react";

interface KEDB {
  id: string;
  title: string;
  description: string;
  content: string;
  matchPercentage?: number;
  rank?: number;
  recommended?: boolean;
}

interface ResultsSectionProps {
  results: KEDB[];
  onOpenKEDB: (kedb: KEDB) => void;
  onBack: () => void;
}

export default function ResultsSection({ results, onOpenKEDB, onBack }: ResultsSectionProps) {
  const recommendedCount = results.filter(kedb => kedb.recommended).length;

  return (
    <div data-testid="results-container">
      <div className="mb-6">
        <Button
          onClick={onBack}
          variant="ghost"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
          data-testid="back-to-main-button"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Search
        </Button>
      </div>

      <Card>
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">
            Suggested KEDB's (<span className="text-primary" data-testid="results-count">{results.length}</span> found)
          </h2>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            {recommendedCount > 0 && (
              <>
                <span className="text-success font-medium" data-testid="recommended-count">
                  {recommendedCount} recommended
                </span>
                <span>•</span>
              </>
            )}
            <span>Ranked by relevance score</span>
          </div>
        </div>
        
        <CardContent className="p-0">
          <div className="divide-y divide-gray-200">
            {results.map((kedb, index) => (
              <div 
                key={kedb.id} 
                className="p-6 hover:bg-gray-50 transition-colors"
                data-testid={`kedb-item-${kedb.id}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-sm font-medium text-gray-500" data-testid={`kedb-rank-${kedb.id}`}>
                        {index + 1}.
                      </span>
                      <a 
                        href="#" 
                        className="text-primary hover:text-blue-600 font-medium"
                        data-testid={`kedb-id-${kedb.id}`}
                      >
                        {kedb.id}
                      </a>
                      {kedb.recommended && (
                        <Badge className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success text-white">
                          <Star className="mr-1 h-3 w-3" />
                          Recommended
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-base font-medium text-gray-900 mb-2" data-testid={`kedb-title-${kedb.id}`}>
                      {kedb.title}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed mb-3" data-testid={`kedb-description-${kedb.id}`}>
                      {kedb.description}
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span data-testid={`kedb-match-${kedb.id}`}>
                        Match: <span className={`font-medium ${kedb.recommended ? 'text-success' : ''}`}>
                          {kedb.matchPercentage?.toFixed(1)}%
                        </span>
                      </span>
                      <span data-testid={`kedb-rank-score-${kedb.id}`}>
                        Rank: <span className="font-medium">{kedb.rank?.toFixed(1)}%</span>
                      </span>
                    </div>
                  </div>
                  <Button
                    onClick={() => onOpenKEDB(kedb)}
                    className={`ml-4 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      kedb.recommended 
                        ? 'bg-success text-white hover:bg-green-600' 
                        : 'bg-secondary text-white hover:bg-gray-600'
                    }`}
                    data-testid={`open-kedb-${kedb.id}`}
                  >
                    Open
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
