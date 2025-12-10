import { GoogleGenAI, Type, Schema, Chat } from "@google/genai";
import { GeneratedExam, GenerationConfig, MediaAnalysisResult } from "../types";

const apiKey = process.env.API_KEY;

// --- EXAM GENERATION ---

const examSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    topic: {
      type: Type.STRING,
      description: "A brief topic or title for the content extracted from the PDF",
    },
    shortQuestions: {
      type: Type.ARRAY,
      description: "A list of 2-mark questions",
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING, description: "The question text" },
          answer: { type: Type.STRING, description: "The concise correct answer" },
          diagramSvg: { type: Type.STRING, description: "A valid standalone SVG code string (starting with <svg) illustrating the answer if a diagram is helpful. Do not use Markdown code blocks." }
        },
        required: ["question", "answer"],
      },
    },
    longQuestions: {
      type: Type.ARRAY,
      description: "A list of 7-mark questions",
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING, description: "The complex question text" },
          answer: { type: Type.STRING, description: "A very detailed, comprehensive answer." },
          diagramSvg: { type: Type.STRING, description: "A valid standalone SVG code string (starting with <svg) illustrating the answer if a diagram is helpful. Do not use Markdown code blocks." }
        },
        required: ["question", "answer"],
      },
    },
    quizQuestions: {
      type: Type.ARRAY,
      description: "A list of multiple choice questions (MCQs)",
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING, description: "The question text" },
          options: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "An array of exactly 4 possible answer options" 
          },
          correctAnswer: { type: Type.STRING, description: "The correct option text (must match exactly one of the options)" }
        },
        required: ["question", "options", "correctAnswer"],
      },
    },
  },
  required: ["topic", "shortQuestions", "longQuestions", "quizQuestions"],
};

export const generateQuestionsFromText = async (text: string, config: GenerationConfig): Promise<GeneratedExam> => {
  if (!apiKey) throw new Error("API Key is missing.");
  const ai = new GoogleGenAI({ apiKey });
  const processedText = text.length > 300000 ? text.substring(0, 300000) + "...[truncated]" : text;

  let taskDescription = "";
  if (config.enableShort) {
    taskDescription += `1. **2 Marks Questions**: Generate exactly ${config.shortCount} short-answer questions. Concise (2-3 sentences).\n`;
  } else {
    taskDescription += `1. **2 Marks Questions**: Return an empty array.\n`;
  }
  if (config.enableLong) {
    taskDescription += `2. **7 Marks Questions**: Generate exactly ${config.longCount} long-answer questions. Detailed (multiple paragraphs).\n`;
  } else {
    taskDescription += `2. **7 Marks Questions**: Return an empty array.\n`;
  }
  if (config.enableQuiz) {
    taskDescription += `3. **Quiz (MCQs)**: Generate exactly ${config.quizCount} multiple choice questions with 4 options each.\n`;
  } else {
    taskDescription += `3. **Quiz (MCQs)**: Return an empty array.\n`;
  }

  const prompt = `
    You are an expert academic examiner. 
    Analyze the text and generate exam questions.
    
    Configuration:
    ${taskDescription}

    **Diagram Instructions**:
    If a question implies a visual explanation, provide a valid, simple SVG XML string in 'diagramSvg'. 
    - Keep it simple black/white wireframe.
    
    Text Content:
    ${processedText}
  `;

  // Use Gemini 3 Pro with thinking if enabled, otherwise Gemini 2.5 Flash
  const model = config.useThinking ? "gemini-3-pro-preview" : "gemini-2.5-flash";
  
  const requestConfig: any = {
    responseMimeType: "application/json",
    responseSchema: examSchema,
    temperature: 0.4,
  };

  if (config.useThinking) {
    requestConfig.thinkingConfig = { thinkingBudget: 32768 };
  }

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: requestConfig,
    });

    if (response.text) {
      return JSON.parse(response.text) as GeneratedExam;
    }
    throw new Error("No response generated.");
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to generate questions.");
  }
};

// --- CHAT WITH TOOLS & THINKING ---

export const createChatSession = (useThinking: boolean, useSearch: boolean) => {
  if (!apiKey) throw new Error("API Key is missing.");
  const ai = new GoogleGenAI({ apiKey });
  
  // Use Gemini 3 Pro for complex tasks (Thinking/Search)
  const model = "gemini-3-pro-preview";
  
  const config: any = {};
  
  if (useThinking) {
    config.thinkingConfig = { thinkingBudget: 32768 };
  }
  
  if (useSearch) {
    config.tools = [{ googleSearch: {} }];
  }

  return ai.chats.create({
    model: model,
    config: config,
    history: [
      {
        role: "user",
        parts: [{ text: "You are a helpful AI tutor. Help me understand complex topics." }],
      },
      {
        role: "model",
        parts: [{ text: "I am ready to help you learn. Ask me anything!" }],
      },
    ],
  });
};

// --- MEDIA ANALYSIS ---

export const analyzeMediaFile = async (file: File, mimeType: string): Promise<string> => {
  if (!apiKey) throw new Error("API Key is missing.");
  const ai = new GoogleGenAI({ apiKey });
  
  // Convert file to base64
  const base64Data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix (e.g., "data:image/png;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  // Select model based on task/media
  // Audio -> 2.5 Flash
  // Video -> 3 Pro
  let model = "gemini-3-pro-preview";
  if (mimeType.startsWith("audio/")) {
    model = "gemini-2.5-flash"; 
  }

  const prompt = mimeType.startsWith("audio/") 
    ? "Transcribe this audio file accurately. Then provide a bulleted summary of the main points discussed."
    : "Analyze this video. Provide a detailed summary of what happens, key visual information, and any spoken content.";

  const response = await ai.models.generateContent({
    model: model,
    contents: {
      parts: [
        { inlineData: { mimeType: mimeType, data: base64Data } },
        { text: prompt }
      ]
    }
  });

  return response.text || "No analysis could be generated.";
};