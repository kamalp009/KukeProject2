import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Search, Wand2, Clock, Layers } from "lucide-react";

interface VersionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VersionModal({ isOpen, onClose }: VersionModalProps) {
  const findKEDBFeatures = [
    "Search KEDB based on manually entered incident description",
    'If you enter with "IS" keyword',
    "Returns up to 5 suggested KEDBs that best match the incident description",
    "Highlight if related match KEDB among the suggested ones if an optimized match is found & in count quick task is found, and suggested KEDBs are displayed",
    "View Resolution steps for any KEDB by clicking on Open button",
  ];

  const generateKEDBFeatures = [
    "You can create a machine learning algorithm for text KEDB generation",
    "You can create machine learning algorithm for text KEDB generation",
    "Generate a new KEDB draft with AI analysis",
    "Populate the KEDB draft PDF document's standardize",
    "Generate live and KEDB document as its basic table",
  ];

  const latestUpdates = [
    "Added modular TypeScript architecture",
    "Enhanced component separation and reusability",
    "Improved API integration with proper error handling",
    "Enhanced responsive design for all devices",
    "Professional UI with CSS Modules",
  ];

  const techStack = [
    "React 18+",
    "TypeScript",
    "CSS Modules",
    "REST APIs",
    "JavaScript ES6+",
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" data-testid="version-modal-content">
        <DialogHeader className="border-b border-gray-200 pb-4">
          <div className="flex justify-between items-center">
            <DialogTitle className="text-xl font-semibold text-gray-900">
              KEDB Draft Generator - Live Features
            </DialogTitle>
            <Badge className="bg-blue-100 text-blue-800">Version v1.0.0</Badge>
          </div>
        </DialogHeader>
        
        <div className="p-6 space-y-8">
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
            <p className="text-blue-800 text-sm leading-relaxed">
              Welcome to the comprehensive features list of the KEDB Draft Generator App! This tool is designed to streamline incident resolution documentation with powerful automation and user-friendly interfaces.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Find KEDB Features */}
            <div>
              <h3 className="flex items-center text-lg font-semibold text-gray-900 mb-4">
                <Search className="text-secondary mr-2 h-5 w-5" />
                Find KEDB
              </h3>
              <ul className="space-y-3 text-sm text-gray-600">
                {findKEDBFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="text-success mr-2 mt-0.5 h-4 w-4 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Generate KEDB Features */}
            <div>
              <h3 className="flex items-center text-lg font-semibold text-gray-900 mb-4">
                <Wand2 className="text-primary mr-2 h-5 w-5" />
                Generate KEDB
              </h3>
              <ul className="space-y-3 text-sm text-gray-600">
                {generateKEDBFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="text-success mr-2 mt-0.5 h-4 w-4 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Latest Updates */}
          <div>
            <h3 className="flex items-center text-lg font-semibold text-gray-900 mb-4">
              <Clock className="text-orange-500 mr-2 h-5 w-5" />
              Latest Updates
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              {latestUpdates.map((update, index) => (
                <li key={index} className="flex items-start">
                  <div className="h-2 w-2 bg-blue-500 rounded-full mr-2 mt-2 flex-shrink-0"></div>
                  {update}
                </li>
              ))}
            </ul>
          </div>

          {/* Technology Stack */}
          <div>
            <h3 className="flex items-center text-lg font-semibold text-gray-900 mb-4">
              <Layers className="text-purple-500 mr-2 h-5 w-5" />
              Technology Stack
            </h3>
            <div className="flex flex-wrap gap-2">
              {techStack.map((tech, index) => (
                <Badge 
                  key={index} 
                  variant="secondary"
                  className="bg-blue-100 text-blue-800"
                >
                  {tech}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
