import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

interface AppHeaderProps {
  onShowVersionModal: () => void;
}

export default function AppHeader({ onShowVersionModal }: AppHeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4" data-testid="header">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-semibold text-gray-900" data-testid="app-title">
            KEDB Draft Generator
          </h1>
        </div>
        <div className="flex items-center space-x-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={onShowVersionModal}
                className="inline-flex items-center px-3 py-1 bg-primary text-white text-sm font-medium rounded-md hover:bg-blue-600 transition-colors"
                data-testid="version-link"
              >
                v1.0.0
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Click to view version features</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                data-testid="help-button"
              >
                <HelpCircle className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Help & Documentation</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </header>
  );
}
