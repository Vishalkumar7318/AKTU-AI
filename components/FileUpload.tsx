import React, { useCallback, useState } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  onFileSelected: (file: File) => void;
  isLoading: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelected, isLoading }) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const validateAndUpload = (file: File) => {
    setError(null);
    if (file.type !== 'application/pdf') {
      setError("Please upload a valid PDF file.");
      return;
    }
    // Limit size to 10MB for this demo
    if (file.size > 10 * 1024 * 1024) {
      setError("File size exceeds 10MB limit.");
      return;
    }
    onFileSelected(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndUpload(e.dataTransfer.files[0]);
    }
  }, [onFileSelected]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndUpload(e.target.files[0]);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto mb-8">
      <div
        className={`relative group flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-2xl transition-all duration-300 ease-in-out cursor-pointer
          ${dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 bg-white hover:bg-slate-50 hover:border-indigo-400'}
          ${isLoading ? 'opacity-50 pointer-events-none' : ''}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={handleChange}
          accept="application/pdf"
          disabled={isLoading}
        />
        
        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
          <div className={`p-4 rounded-full mb-4 transition-colors ${dragActive ? 'bg-indigo-100' : 'bg-slate-100 group-hover:bg-indigo-50'}`}>
            <Upload className={`w-10 h-10 ${dragActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-500'}`} />
          </div>
          
          <p className="mb-2 text-lg font-medium text-slate-700">
            {isLoading ? "Processing..." : "Click to upload or drag and drop"}
          </p>
          <p className="text-sm text-slate-500">
            PDF documents only (Max 10MB)
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-3 flex items-center p-3 text-sm text-red-600 bg-red-50 rounded-lg animate-fade-in">
          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
};

export default FileUpload;