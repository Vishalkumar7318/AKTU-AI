export interface QAPair {
  question: string;
  answer: string;
  diagramSvg?: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}

export interface GeneratedExam {
  topic: string;
  shortQuestions: QAPair[]; // 2 marks
  longQuestions: QAPair[];  // 7 marks
  quizQuestions: QuizQuestion[]; // MCQs
}

export interface GenerationConfig {
  enableShort: boolean;
  shortCount: number;
  enableLong: boolean;
  longCount: number;
  enableQuiz: boolean;
  quizCount: number;
  useThinking?: boolean;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  topic: string;
  data: GeneratedExam;
}

export enum AppState {
  IDLE = 'IDLE',
  PARSING_PDF = 'PARSING_PDF',
  GENERATING_QA = 'GENERATING_QA',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface ParsingError {
  message: string;
  details?: string;
}

// Navigation
export enum ViewMode {
  LANDING = 'LANDING',
  EXAM_GENERATOR = 'EXAM_GENERATOR',
  CHAT_TUTOR = 'CHAT_TUTOR',
  LIVE_TUTOR = 'LIVE_TUTOR',
  MEDIA_ANALYZER = 'MEDIA_ANALYZER'
}

// Chat
export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isThinking?: boolean;
  groundingSources?: Array<{uri: string, title: string}>;
}

export interface ChatConfig {
  useThinking: boolean;
  useSearch: boolean;
}

// Media
export interface MediaAnalysisResult {
  transcript?: string;
  summary?: string;
  keyPoints?: string[];
}