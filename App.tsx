import React, { useState } from 'react';
import { ViewMode } from './types';
import ExamGenerator from './components/ExamGenerator';
import ChatTutor from './components/ChatTutor';
import LiveTutor from './components/LiveTutor';
import MediaAnalyzer from './components/MediaAnalyzer';
import { BrainCircuit, BookOpen, MessageSquare, Mic, Video, ArrowRight, Zap, Shield, Sparkles } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewMode>(ViewMode.LANDING);

  const renderView = () => {
    switch (currentView) {
      case ViewMode.LANDING: return <LandingPage onNavigate={setCurrentView} />;
      case ViewMode.EXAM_GENERATOR: return <ExamGenerator />;
      case ViewMode.CHAT_TUTOR: return <ChatTutor />;
      case ViewMode.LIVE_TUTOR: return <LiveTutor />;
      case ViewMode.MEDIA_ANALYZER: return <MediaAnalyzer />;
      default: return <ExamGenerator />;
    }
  };

  const NavButton = ({ mode, icon: Icon, label }: { mode: ViewMode, icon: any, label: string }) => (
    <button
      onClick={() => setCurrentView(mode)}
      className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200 ${
        currentView === mode 
          ? 'bg-indigo-600 text-white shadow-lg scale-105' 
          : 'bg-white text-slate-500 hover:bg-slate-50 hover:text-indigo-600'
      }`}
    >
      <Icon className="w-6 h-6 mb-1" />
      <span className="text-xs font-medium">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-24 md:pb-10">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center cursor-pointer" onClick={() => setCurrentView(ViewMode.LANDING)}>
              <div className="bg-indigo-600 p-2 rounded-lg mr-3 shadow-sm">
                <BrainCircuit className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                AKTU AI
              </span>
            </div>
            {/* Desktop Nav */}
            <div className="hidden md:flex space-x-2">
              <button 
                onClick={() => setCurrentView(ViewMode.EXAM_GENERATOR)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${currentView === ViewMode.EXAM_GENERATOR ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                PDF Exam
              </button>
              <button 
                onClick={() => setCurrentView(ViewMode.CHAT_TUTOR)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${currentView === ViewMode.CHAT_TUTOR ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                AI Tutor
              </button>
              <button 
                onClick={() => setCurrentView(ViewMode.LIVE_TUTOR)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${currentView === ViewMode.LIVE_TUTOR ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                Live Voice
              </button>
              <button 
                onClick={() => setCurrentView(ViewMode.MEDIA_ANALYZER)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${currentView === ViewMode.MEDIA_ANALYZER ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                Media
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderView()}
      </main>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-2 flex justify-between z-50">
         <NavButton mode={ViewMode.EXAM_GENERATOR} icon={BookOpen} label="Exam" />
         <NavButton mode={ViewMode.CHAT_TUTOR} icon={MessageSquare} label="Chat" />
         <NavButton mode={ViewMode.LIVE_TUTOR} icon={Mic} label="Live" />
         <NavButton mode={ViewMode.MEDIA_ANALYZER} icon={Video} label="Media" />
      </div>
    </div>
  );
};

// --- Landing Page Component ---

const LandingPage: React.FC<{ onNavigate: (mode: ViewMode) => void }> = ({ onNavigate }) => {
  return (
    <div className="animate-fade-in-up">
      {/* Hero Section */}
      <div className="text-center py-16 md:py-24 max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-6 leading-tight">
          Your All-in-One <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600">
            AI Study Companion
          </span>
        </h1>
        <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-2xl mx-auto">
          Transform your learning experience. Generate exams from PDFs, chat with an intelligent tutor, practice oral exams, and analyze lectures instantly.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button 
            onClick={() => onNavigate(ViewMode.EXAM_GENERATOR)}
            className="px-8 py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-indigo-200 flex items-center justify-center gap-2"
          >
            Start Learning <ArrowRight className="w-5 h-5" />
          </button>
          <button 
             onClick={() => onNavigate(ViewMode.LIVE_TUTOR)}
             className="px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold text-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
          >
             Try Voice Mode
          </button>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
        <FeatureCard 
          icon={BookOpen} 
          color="blue"
          title="Exam Generator" 
          desc="Turn PDFs into full practice exams with short & long questions." 
          onClick={() => onNavigate(ViewMode.EXAM_GENERATOR)}
        />
        <FeatureCard 
          icon={MessageSquare} 
          color="purple"
          title="AI Chat Tutor" 
          desc="Deep reasoning chat with web search grounding for complex topics." 
          onClick={() => onNavigate(ViewMode.CHAT_TUTOR)}
        />
        <FeatureCard 
          icon={Mic} 
          color="rose"
          title="Live Voice Tutor" 
          desc="Real-time oral exam practice with native audio interaction." 
          onClick={() => onNavigate(ViewMode.LIVE_TUTOR)}
        />
        <FeatureCard 
          icon={Video} 
          color="emerald"
          title="Media Analyzer" 
          desc="Upload audio or video lectures for instant transcription & summary." 
          onClick={() => onNavigate(ViewMode.MEDIA_ANALYZER)}
        />
      </div>

      {/* Stats / Trust */}
      <div className="border-t border-slate-200 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center max-w-4xl mx-auto">
          <div>
            <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
               <Zap className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg">Lightning Fast</h3>
            <p className="text-slate-500 text-sm mt-1">Powered by Gemini 2.5 Flash for instant results</p>
          </div>
          <div>
            <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
               <BrainCircuit className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg">Deep Reasoning</h3>
            <p className="text-slate-500 text-sm mt-1">Uses Gemini 3 Pro for complex problem solving</p>
          </div>
          <div>
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
               <Shield className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg">Private & Secure</h3>
            <p className="text-slate-500 text-sm mt-1">Your documents are processed securely in your browser</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const FeatureCard: React.FC<{ icon: any, title: string, desc: string, onClick: () => void, color: string }> = ({ icon: Icon, title, desc, onClick, color }) => {
  const colorClasses: any = {
    blue: "bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white",
    purple: "bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white",
    rose: "bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white",
    emerald: "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white"
  };

  return (
    <button 
      onClick={onClick}
      className="group p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left h-full flex flex-col"
    >
      <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-colors ${colorClasses[color]}`}>
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-500 leading-relaxed flex-1">{desc}</p>
      <div className="mt-6 flex items-center text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
        Try Feature <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
      </div>
    </button>
  );
};

export default App;