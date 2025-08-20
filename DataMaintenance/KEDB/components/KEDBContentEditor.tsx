import React, { useState } from "react";
import { ArrowLeft, Download, Save } from "lucide-react";
import { useUpdateKEDB } from "../hooks/useKEDBApi";
import { KEDB } from "../types/kedb";

interface KEDBContentEditorProps {
  kedb: KEDB;
  onBack: () => void;
  onKEDBUpdate: (kedb: KEDB) => void;
}

const KEDBContentEditor: React.FC<KEDBContentEditorProps> = ({ 
  kedb, 
  onBack, 
  onKEDBUpdate 
}) => {
  const [title, setTitle] = useState(kedb.title);
  const [content, setContent] = useState(kedb.content);
  const updateMutation = useUpdateKEDB();

  const showToast = (title: string, description: string, type: "success" | "error" = "success") => {
    console.log(`${type.toUpperCase()}: ${title} - ${description}`);
  };

  const formatLastModified = (date: Date | string | null | undefined) => {
    if (!date) return "Unknown";
    const now = new Date();
    const targetDate = new Date(date);
    const diffInHours = Math.floor((now.getTime() - targetDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours === 1) return "1 hour ago";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return "1 day ago";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    return targetDate.toLocaleDateString();
  };

  const handleSave = () => {
    const updates = { title, content };
    updateMutation.mutate(
      { id: kedb.id, updates },
      {
        onSuccess: (data) => {
          onKEDBUpdate(data.data);
          showToast("Success", "KEDB updated successfully");
        },
        onError: (error) => {
          showToast("Error", error.message || "Failed to update KEDB", "error");
        },
      }
    );
  };

  const handleDownload = () => {
    const downloadContent = `${title}\n\n${content}`;
    const sanitizedTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `${kedb.id}_${sanitizedTitle}.txt`;
    
    const blob = new Blob([downloadContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showToast("Success", "KEDB content downloaded");
  };

  return (
    <div className="kedb-content-editor">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Results
            </button>
            <div className="h-4 w-px bg-gray-300"></div>
            <h2 className="text-lg font-medium text-gray-900">
              Content Editor - <span className="text-blue-600">{kedb.id}</span>
            </h2>
          </div>
          <button
            onClick={handleDownload}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            <Download className="mr-2 h-4 w-4" />
            Download
          </button>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <label 
                htmlFor="content-title" 
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Title
              </label>
              <input
                type="text"
                id="content-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label 
                htmlFor="content-editor-textarea" 
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Content
              </label>
              <textarea
                id="content-editor-textarea"
                rows={20}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-md text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
              />
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                Last modified: <span>{formatLastModified(kedb.updatedAt)}</span>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KEDBContentEditor;