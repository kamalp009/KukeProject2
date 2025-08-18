import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Search, Wand2, Loader2 } from "lucide-react";
import { useSearchKEDBs, useGenerateKEDB } from "@/hooks/use-kedb";
import { useToast } from "@/hooks/use-toast";

interface KEDB {
  id: string;
  title: string;
  description: string;
  content: string;
  matchPercentage?: number;
  rank?: number;
  recommended?: boolean;
}

interface InputSectionProps {
  incidentDescription: string;
  onIncidentDescriptionChange: (value: string) => void;
  onFindKEDBSuccess: (results: KEDB[]) => void;
  onGenerateKEDBSuccess: (kedb: KEDB) => void;
}

export default function InputSection({
  incidentDescription,
  onIncidentDescriptionChange,
  onFindKEDBSuccess,
  onGenerateKEDBSuccess,
}: InputSectionProps) {
  const { toast } = useToast();
  const searchMutation = useSearchKEDBs();
  const generateMutation = useGenerateKEDB();

  const hasText = incidentDescription.trim().length > 0;

  const handleFindKEDB = () => {
    if (!hasText) {
      toast({
        title: "Error",
        description: "Please enter an incident description before searching.",
        variant: "destructive",
      });
      return;
    }

    searchMutation.mutate(incidentDescription, {
      onSuccess: (data) => {
        // Handle different response formats from backend
        const results = data.data || data.results || data || [];
        const count = data.count || results.length || 0;
        
        onFindKEDBSuccess(results);
        toast({
          title: "Success",
          description: `Found ${count} suggested KEDBs`,
        });
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message || "Failed to search KEDBs. Please try again.",
          variant: "destructive",
        });
      },
    });
  };

  const handleGenerateKEDB = () => {
    if (!hasText) {
      toast({
        title: "Error",
        description: "Please enter an incident description before generating.",
        variant: "destructive",
      });
      return;
    }

    generateMutation.mutate(incidentDescription, {
      onSuccess: (data) => {
        // Handle different response formats from backend
        const kedb = data.data || data.kedb || data;
        
        onGenerateKEDBSuccess(kedb);
        toast({
          title: "Success",
          description: "KEDB generated successfully",
        });
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message || "Failed to generate KEDB. Please try again.",
          variant: "destructive",
        });
      },
    });
  };

  const isLoading = searchMutation.isPending || generateMutation.isPending;

  return (
    <div className="space-y-6">
      <Card data-testid="input-card">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="incident-description" className="block text-sm font-medium text-gray-700 mb-3">
                Enter Incident Short Description
              </Label>
              <Textarea
                id="incident-description"
                rows={4}
                className="w-full px-3 py-3 border border-gray-300 rounded-md text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                placeholder="Enter detailed incident description for better KEDB matching..."
                value={incidentDescription}
                onChange={(e) => onIncidentDescriptionChange(e.target.value)}
                disabled={isLoading}
                data-testid="incident-description-textarea"
              />
            </div>
            
            <div className="flex space-x-3">
              <Button
                onClick={handleFindKEDB}
                disabled={!hasText || isLoading}
                className="px-6 py-2.5 bg-secondary text-white text-sm font-medium rounded-md hover:bg-gray-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                data-testid="find-kedb-button"
              >
                {searchMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Search className="mr-2 h-4 w-4" />
                )}
                Find KEDB
              </Button>
              <Button
                onClick={handleGenerateKEDB}
                disabled={!hasText || isLoading}
                className="px-6 py-2.5 bg-primary text-white text-sm font-medium rounded-md hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                data-testid="generate-kedb-button"
              >
                {generateMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="mr-2 h-4 w-4" />
                )}
                Generate KEDB
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <Card data-testid="loading-card">
          <CardContent className="p-8 text-center">
            <div className="inline-flex items-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-gray-600">
                {searchMutation.isPending ? "Searching KEDBs..." : "Generating KEDB..."}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
