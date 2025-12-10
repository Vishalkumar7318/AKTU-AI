import React, { useState, useEffect } from 'react';
import { extractTextFromPdf } from '../utils/pdfUtils';
import { generateQuestionsFromText } from '../services/geminiService';
import { AppState, GeneratedExam, GenerationConfig, HistoryItem } from '../types';
import FileUpload from './FileUpload';
import ResultDisplay from './ResultDisplay';
import { Sparkles, AlertTriangle, Sliders, BrainCircuit, History, Clock, Trash2, ArrowRight } from 'lucide-react';

const HISTORY_KEY = 'exam_generator_history';
const CONFIG_KEY = 'exam_generator_config';

const ExamGenerator: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [generatedData, setGeneratedData] = useState<GeneratedExam | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  
  // Initialize config from localStorage or use defaults
  const [config, setConfig] = useState<GenerationConfig>(() => {
    const savedConfig = localStorage.getItem(CONFIG_KEY);
    if (savedConfig) {
      try {
        return JSON.parse(savedConfig);
      } catch (e) {
        console.error("Failed to parse saved config", e);
      }
    }
    return {
      enableShort: true,
      shortCount: 10,
      enableLong: true,
      longCount: 5,
      enableQuiz: false,
      quizCount: 10,
      useThinking: false
    };
  });

  // Save config to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    const saved = localStorage.getItem(HISTORY_KEY);
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  const saveToHistory = (data: GeneratedExam) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      topic: data.topic,
      data: data
    };
    const updated = [newItem, ...history].slice(0, 20); // Keep last 20
    setHistory(updated);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  };

  const deleteHistoryItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = history.filter(item => item.id !== id);
    setHistory(updated);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  };

  const loadFromHistory = (item: HistoryItem) => {
    setGeneratedData(item.data);
    setAppState(AppState.SUCCESS);
    setShowHistory(false);
  };

  const handleFileSelect = async (file: File) => {
    setAppState(AppState.PARSING_PDF);
    setErrorMessage(null);

    try {
      const text = await extractTextFromPdf(file);
      if (!text || text.trim().length === 0) {
        throw new Error("Could not extract text from this PDF.");
      }
      setAppState(AppState.GENERATING_QA);
      const data = await generateQuestionsFromText(text, config);
      setGeneratedData(data);
      saveToHistory(data);
      setAppState(AppState.SUCCESS);
    } catch (error: any) {
      console.error(error);
      setAppState(AppState.ERROR);
      setErrorMessage(error.message || "An unexpected error occurred.");
    }
  };

  const handleReset = () => {
    setAppState(AppState.IDLE);
    setGeneratedData(null);
    setErrorMessage(null);
  };

  if (appState === AppState.SUCCESS && generatedData) {
    return <ResultDisplay data={generatedData} onReset={handleReset} />;
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in-up">
       <div className="flex justify-between items-start mb-10">
         <div className="text-center flex-1">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">PDF to Exam Generator</h2>
          <p className="text-slate-600">Upload your study material and let Gemini create a custom exam for you.</p>
         </div>
         <button 
           onClick={() => setShowHistory(!showHistory)}
           className={`p-2 rounded-lg transition-colors ${showHistory ? 'bg-indigo-100 text-indigo-600' : 'bg-white text-slate-500 hover:text-indigo-600 border border-slate-200'}`}
           title="History"
         >
           <History className="w-5 h-5" />
         </button>
      </div>

      {showHistory && (
        <div className="mb-8 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Recent Exams
            </h3>
            {history.length > 0 && (
              <button 
                onClick={() => { setHistory([]); localStorage.removeItem(HISTORY_KEY); }}
                className="text-xs text-red-500 hover:text-red-700"
              >
                Clear All
              </button>
            )}
          </div>
          {history.length === 0 ? (
            <div className="p-8 text-center text-slate-400">No history yet.</div>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              {history.map(item => (
                <div 
                  key={item.id} 
                  onClick={() => loadFromHistory(item)}
                  className="flex items-center justify-between p-4 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0 group"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-slate-800 truncate">{item.topic || "Untitled Exam"}</h4>
                    <p className="text-xs text-slate-500">
                      {new Date(item.timestamp).toLocaleDateString()} • {item.data.shortQuestions.length + item.data.longQuestions.length + (item.data.quizQuestions?.length || 0)} questions
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600" />
                    <button 
                      onClick={(e) => deleteHistoryItem(e, item.id)}
                      className="p-1 text-slate-300 hover:text-red-500 rounded hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {(appState === AppState.PARSING_PDF || appState === AppState.GENERATING_QA) ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-sm border border-slate-100">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-indigo-100 rounded-full animate-spin border-t-indigo-600"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
            <h2 className="mt-6 text-xl font-bold text-slate-800">
              {appState === AppState.PARSING_PDF ? "Reading Document..." : "Generating Exam..."}
            </h2>
            <p className="text-slate-500 mt-2 text-sm max-w-sm text-center">
              {config.useThinking 
                ? "Using Gemini 3.0 Pro Thinking Mode. This may take a little longer to ensure high quality." 
                : "Generating many questions may take up to 60 seconds."}
            </p>
          </div>
      ) : (
        <>
          <FileUpload onFileSelected={handleFileSelect} isLoading={appState !== AppState.IDLE} />
          
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm mt-8">
            <div className="flex items-center gap-2 mb-4 text-slate-800">
              <Sliders className="w-5 h-5 text-indigo-600" />
              <h3 className="font-semibold text-lg">Configuration</h3>
            </div>
            
            <div className="space-y-4">
              {/* Short Questions */}
              <div className="flex flex-col sm:flex-row gap-4 justify-between p-4 bg-blue-50/50 rounded-lg border border-blue-100">
                <div className="flex items-center gap-3">
                   <input type="checkbox" checked={config.enableShort} onChange={(e) => setConfig({...config, enableShort: e.target.checked})} className="w-5 h-5 text-indigo-600 rounded" />
                  <label className="font-medium text-slate-700">2 Marks Questions</label>
                </div>
                {config.enableShort && (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-500">Count:</span>
                    <input type="range" min="1" max="50" value={config.shortCount} onChange={(e) => setConfig({...config, shortCount: parseInt(e.target.value)})} className="w-32 h-2 bg-slate-200 rounded-lg accent-indigo-600" />
                    <span className="w-6 font-bold text-slate-700 text-right">{config.shortCount}</span>
                  </div>
                )}
              </div>

              {/* Long Questions */}
              <div className="flex flex-col sm:flex-row gap-4 justify-between p-4 bg-purple-50/50 rounded-lg border border-purple-100">
                <div className="flex items-center gap-3">
                   <input type="checkbox" checked={config.enableLong} onChange={(e) => setConfig({...config, enableLong: e.target.checked})} className="w-5 h-5 text-indigo-600 rounded" />
                  <label className="font-medium text-slate-700">7 Marks Questions</label>
                </div>
                {config.enableLong && (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-500">Count:</span>
                    <input type="range" min="1" max="20" value={config.longCount} onChange={(e) => setConfig({...config, longCount: parseInt(e.target.value)})} className="w-32 h-2 bg-slate-200 rounded-lg accent-purple-600" />
                    <span className="w-6 font-bold text-slate-700 text-right">{config.longCount}</span>
                  </div>
                )}
              </div>

              {/* Quiz Questions */}
              <div className="flex flex-col sm:flex-row gap-4 justify-between p-4 bg-emerald-50/50 rounded-lg border border-emerald-100">
                <div className="flex items-center gap-3">
                   <input type="checkbox" checked={config.enableQuiz} onChange={(e) => setConfig({...config, enableQuiz: e.target.checked})} className="w-5 h-5 text-emerald-600 rounded" />
                  <label className="font-medium text-slate-700">Quiz / MCQs</label>
                </div>
                {config.enableQuiz && (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-500">Count:</span>
                    {/* Max 100 limit as requested */}
                    <input type="range" min="1" max="100" value={config.quizCount} onChange={(e) => setConfig({...config, quizCount: parseInt(e.target.value)})} className="w-32 h-2 bg-slate-200 rounded-lg accent-emerald-600" />
                    <span className="w-8 font-bold text-slate-700 text-right">{config.quizCount}</span>
                  </div>
                )}
              </div>

              {/* Thinking Mode */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <BrainCircuit className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-800">Thinking Mode</h4>
                      <p className="text-xs text-slate-500">Use Gemini 3.0 Pro for deeper reasoning and higher quality questions.</p>
                    </div>
                 </div>
                 <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out">
                    <input 
                      type="checkbox" 
                      id="thinking-toggle"
                      className="peer absolute opacity-0 w-0 h-0"
                      checked={config.useThinking}
                      onChange={(e) => setConfig({...config, useThinking: e.target.checked})}
                    />
                    <label 
                      htmlFor="thinking-toggle" 
                      className={`block w-12 h-6 rounded-full cursor-pointer transition-colors ${config.useThinking ? 'bg-indigo-600' : 'bg-slate-300'}`}
                    ></label>
                    <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${config.useThinking ? 'translate-x-6' : 'translate-x-0'}`}></div>
                 </div>
              </div>
            </div>
          </div>
        </>
      )}

      {appState === AppState.ERROR && (
        <div className="mt-6 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-center gap-3 animate-fade-in">
          <AlertTriangle className="w-6 h-6" />
          <span>{errorMessage}</span>
          <button onClick={handleReset} className="ml-auto text-sm font-bold hover:underline">Retry</button>
        </div>
      )}
    </div>
  );
};

export default ExamGenerator;