import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Download, Save } from "lucide-react";
import { useUpdateKEDB } from "@/hooks/use-kedb";
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

interface ContentEditorProps {
  kedb: KEDB;
  onBack: () => void;
  onKEDBUpdate: (kedb: KEDB) => void;
}

export default function ContentEditor({ kedb, onBack, onKEDBUpdate }: ContentEditorProps) {
  const [title, setTitle] = useState(kedb.title);
  const [content, setContent] = useState(kedb.content);
  const { toast } = useToast();
  const updateMutation = useUpdateKEDB();

  const formatLastModified = (date: Date | null | undefined) => {
    if (!date) return "Unknown";
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - new Date(date).getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours === 1) return "1 hour ago";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return "1 day ago";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    return new Date(date).toLocaleDateString();
  };

  const handleSave = () => {
    const updates = { title, content };
    updateMutation.mutate(
      { id: kedb.id, updates },
      {
        onSuccess: (data) => {
          onKEDBUpdate(data.data);
          toast({
            title: "Success",
            description: "KEDB updated successfully",
          });
        },
        onError: (error) => {
          toast({
            title: "Error",
            description: error.message || "Failed to update KEDB",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleDownload = () => {
    window.open(`/api/kedbs/${kedb.id}/download`, '_blank');
    toast({
      title: "Success",
      description: "Download started",
    });
  };

  return (
    <div data-testid="content-editor-container">
      <Card>
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button
              onClick={onBack}
              variant="ghost"
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
              data-testid="back-to-results-button"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Results
            </Button>
            <div className="h-4 w-px bg-gray-300"></div>
            <h2 className="text-lg font-medium text-gray-900">
              Content Editor - <span className="text-primary" data-testid="selected-kedb-id">{kedb.id}</span>
            </h2>
          </div>
          <Button
            onClick={handleDownload}
            className="inline-flex items-center px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-blue-600 transition-colors"
            data-testid="download-button"
          >
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </div>
        
        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="content-title" className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </Label>
              <Input
                type="text"
                id="content-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                data-testid="title-input"
              />
            </div>
            
            <div>
              <Label htmlFor="content-editor-textarea" className="block text-sm font-medium text-gray-700 mb-2">
                Content
              </Label>
              <Textarea
                id="content-editor-textarea"
                rows={20}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-md text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-y"
                data-testid="content-textarea"
              />
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-500" data-testid="last-modified">
                Last modified: <span>{formatLastModified(kedb.updatedAt)}</span>
              </div>
              <div className="flex space-x-3">
                <Button
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                  className="px-4 py-2 bg-success text-white text-sm font-medium rounded-md hover:bg-green-600 transition-colors disabled:opacity-50"
                  data-testid="save-button"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
