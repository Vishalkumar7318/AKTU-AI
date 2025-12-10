import React, { useState } from 'react';
import { Upload, FileVideo, FileAudio, PlayCircle, Loader2 } from 'lucide-react';
import { analyzeMediaFile } from '../services/geminiService';

const MediaAnalyzer: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setAnalysis("");
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setIsLoading(true);
    try {
      const result = await analyzeMediaFile(file, file.type);
      setAnalysis(result);
    } catch (error) {
      setAnalysis("Error analyzing file. Please ensure it is a supported Audio/Video format and under 20MB.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-in-up">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-slate-900 mb-4">Media Analyzer</h2>
        <p className="text-slate-600">Upload lectures, recordings, or videos for instant transcription and summary.</p>
      </div>

      <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
        <div className="border-2 border-dashed border-slate-300 rounded-xl p-10 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors relative">
          <input 
            type="file" 
            accept="audio/*,video/*" 
            onChange={handleFileChange} 
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          {file ? (
            <div className="flex flex-col items-center text-indigo-600">
               {file.type.startsWith('audio') ? <FileAudio className="w-16 h-16 mb-4" /> : <FileVideo className="w-16 h-16 mb-4" />}
               <span className="font-bold text-lg">{file.name}</span>
               <span className="text-sm text-slate-400 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
            </div>
          ) : (
            <div className="flex flex-col items-center text-slate-400">
              <Upload className="w-16 h-16 mb-4" />
              <span className="font-medium text-lg text-slate-600">Click to Upload Audio or Video</span>
              <span className="text-sm mt-2">MP3, WAV, MP4, MOV (Max 20MB)</span>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-center">
          <button 
            onClick={handleAnalyze}
            disabled={!file || isLoading}
            className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold text-lg shadow-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <PlayCircle className="w-5 h-5" />}
            {isLoading ? "Analyzing Media..." : "Start Analysis"}
          </button>
        </div>
      </div>

      {analysis && (
        <div className="mt-8 bg-white rounded-2xl p-8 border border-slate-200 shadow-sm animate-fade-in">
          <h3 className="text-xl font-bold text-slate-800 mb-4">Analysis Result</h3>
          <div className="prose prose-slate max-w-none whitespace-pre-line text-slate-700 leading-relaxed">
            {analysis}
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaAnalyzer;
