import React, { useState } from 'react';
import { GeneratedExam, QAPair, QuizQuestion } from '../types';
import { ChevronDown, ChevronUp, BookOpen, GraduationCap, Copy, Check, Image as ImageIcon, Download, FileText, CheckCircle2 } from 'lucide-react';
import { jsPDF } from 'jspdf';

interface ResultDisplayProps {
  data: GeneratedExam;
  onReset: () => void;
}

const QuestionItem: React.FC<{ qa: QAPair; index: number; type: 'short' | 'long' }> = ({ qa, index, type }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden mb-4 bg-white shadow-sm hover:shadow-md transition-shadow">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left p-4 flex items-start justify-between bg-white hover:bg-slate-50 transition-colors"
      >
        <div className="flex gap-4">
          <span className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
            type === 'short' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
          }`}>
            Q{index + 1}
          </span>
          <div className="flex-1">
            <h3 className="text-slate-800 font-medium leading-relaxed pr-4">
              {qa.question}
            </h3>
            <div className="flex gap-2 mt-2">
              <span className={`inline-block text-xs font-semibold px-2 py-1 rounded border ${
                 type === 'short' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-purple-50 text-purple-600 border-purple-100'
              }`}>
                {type === 'short' ? '2 Marks' : '7 Marks'}
              </span>
              {qa.diagramSvg && (
                <span className="inline-flex items-center text-xs font-semibold px-2 py-1 rounded border bg-amber-50 text-amber-600 border-amber-100">
                  <ImageIcon className="w-3 h-3 mr-1" /> Diagram Included
                </span>
              )}
            </div>
          </div>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-slate-400 flex-shrink-0 mt-1" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0 mt-1" />
        )}
      </button>
      
      {isOpen && (
        <div className="p-5 bg-slate-50 border-t border-slate-100">
          <div className="prose prose-slate max-w-none">
             <div className="mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Answer Scheme</div>
             <p className="text-slate-700 whitespace-pre-line leading-relaxed mb-4">
               {qa.answer}
             </p>
             
             {qa.diagramSvg && (
               <div className="mt-6 p-4 bg-white border border-slate-200 rounded-lg">
                 <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Visual Diagram</div>
                 <div 
                   className="w-full overflow-x-auto flex justify-center p-2"
                   dangerouslySetInnerHTML={{ __html: qa.diagramSvg }} 
                 />
                 <p className="text-center text-xs text-slate-400 mt-2">AI Generated Diagram</p>
               </div>
             )}
          </div>
        </div>
      )}
    </div>
  );
};

const QuizItem: React.FC<{ question: QuizQuestion; index: number }> = ({ question, index }) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);

  const isCorrect = selectedOption !== null && question.options[selectedOption] === question.correctAnswer;

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden mb-4 bg-white shadow-sm hover:shadow-md transition-shadow p-5">
       <div className="flex gap-4 mb-4">
          <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold bg-emerald-100 text-emerald-700">
            {index + 1}
          </span>
          <h3 className="text-slate-800 font-medium leading-relaxed mt-1">
            {question.question}
          </h3>
       </div>

       <div className="pl-12 space-y-2">
         {question.options.map((option, idx) => {
            let itemClass = "border-slate-200 hover:bg-slate-50";
            if (showAnswer) {
               if (option === question.correctAnswer) itemClass = "bg-green-50 border-green-200 text-green-700 font-medium";
               else if (selectedOption === idx && option !== question.correctAnswer) itemClass = "bg-red-50 border-red-200 text-red-600";
            } else if (selectedOption === idx) {
               itemClass = "bg-indigo-50 border-indigo-200 text-indigo-700";
            }

            return (
              <button
                key={idx}
                onClick={() => { if (!showAnswer) setSelectedOption(idx); }}
                className={`w-full text-left p-3 rounded-lg border flex items-center transition-all ${itemClass}`}
                disabled={showAnswer}
              >
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 ${
                   showAnswer && option === question.correctAnswer ? 'border-green-500 bg-green-500 text-white' : 'border-slate-300'
                }`}>
                  {showAnswer && option === question.correctAnswer && <Check className="w-3 h-3" />}
                </div>
                {option}
              </button>
            )
         })}
       </div>

       <div className="pl-12 mt-4 flex items-center gap-4">
         <button 
           onClick={() => setShowAnswer(!showAnswer)}
           className="text-sm font-bold text-indigo-600 hover:underline"
         >
           {showAnswer ? "Hide Answer" : "Show Answer"}
         </button>
         {showAnswer && (
           <span className="text-sm text-slate-500">Correct Answer: <span className="font-semibold">{question.correctAnswer}</span></span>
         )}
       </div>
    </div>
  );
};

const ResultDisplay: React.FC<ResultDisplayProps> = ({ data, onReset }) => {
  const [activeTab, setActiveTab] = useState<'short' | 'long' | 'quiz'>('short');
  const [copied, setCopied] = useState(false);

  // Set initial tab based on data availability
  React.useEffect(() => {
     if (data.shortQuestions.length > 0) setActiveTab('short');
     else if (data.longQuestions.length > 0) setActiveTab('long');
     else if (data.quizQuestions && data.quizQuestions.length > 0) setActiveTab('quiz');
  }, [data]);

  const copyToClipboard = () => {
    const text = `Topic: ${data.topic}\n\n` + 
      (data.shortQuestions.length > 0 ? `--- 2 Mark Questions ---\n` +
      data.shortQuestions.map((q, i) => `Q${i+1}: ${q.question}\nA: ${q.answer}`).join('\n\n') : '') +
      (data.longQuestions.length > 0 ? `\n\n--- 7 Mark Questions ---\n` +
      data.longQuestions.map((q, i) => `Q${i+1}: ${q.question}\nA: ${q.answer}`).join('\n\n') : '') + 
      (data.quizQuestions?.length > 0 ? `\n\n--- Quiz Questions ---\n` + 
      data.quizQuestions.map((q, i) => `Q${i+1}: ${q.question}\nOptions: ${q.options.join(', ')}\nAnswer: ${q.correctAnswer}`).join('\n\n') : '');
    
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    let content = `# ${data.topic || "Generated Exam"}\n\n`;

    if (data.shortQuestions.length > 0) {
      content += `## Part A: 2 Marks Questions\n\n`;
      data.shortQuestions.forEach((q, i) => {
        content += `Q${i + 1}. ${q.question}\n`;
        content += `Answer: ${q.answer}\n`;
        if (q.diagramSvg) content += `[Diagram: See web version for visual]\n`;
        content += `\n---\n\n`;
      });
    }

    if (data.longQuestions.length > 0) {
      content += `\n## Part B: 7 Marks Questions\n\n`;
      data.longQuestions.forEach((q, i) => {
        content += `Q${i + 1}. ${q.question}\n`;
        content += `Answer: ${q.answer}\n`;
        if (q.diagramSvg) content += `[Diagram: See web version for visual]\n`;
        content += `\n---\n\n`;
      });
    }

    if (data.quizQuestions && data.quizQuestions.length > 0) {
      content += `\n## Part C: Multiple Choice Questions\n\n`;
      data.quizQuestions.forEach((q, i) => {
        content += `Q${i + 1}. ${q.question}\n`;
        q.options.forEach(opt => content += `- ${opt}\n`);
        content += `\nCorrect Answer: ${q.correctAnswer}\n`;
        content += `\n---\n\n`;
      });
    }

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const filename = (data.topic || 'exam').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    a.download = `${filename}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxLineWidth = pageWidth - margin * 2;
    let y = margin;

    const checkPageBreak = (heightNeeded: number) => {
        if (y + heightNeeded >= pageHeight - margin) {
            doc.addPage();
            y = margin;
        }
    };

    // Title
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    const titleLines = doc.splitTextToSize(data.topic || "Generated Exam", maxLineWidth);
    doc.text(titleLines, margin, y);
    y += titleLines.length * 10 + 10;

    // Metadata
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated by AKTU AI`, margin, y);
    y += 15;

    // Helper for sections
    const addSection = (title: string, questions: QAPair[]) => {
        if (questions.length === 0) return;

        checkPageBreak(25);
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0); // Black
        doc.text(title, margin, y);
        y += 10;

        doc.setLineWidth(0.5);
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, y, pageWidth - margin, y);
        y += 10;

        questions.forEach((q, i) => {
             doc.setFontSize(12);
             
             // Question
             doc.setFont("helvetica", "bold");
             doc.setTextColor(0, 0, 0);
             const qPrefix = `Q${i + 1}. `;
             const qLines = doc.splitTextToSize(qPrefix + q.question, maxLineWidth);
             checkPageBreak(qLines.length * 7 + 10);
             doc.text(qLines, margin, y);
             y += qLines.length * 7 + 3;

             // Answer
             doc.setFont("helvetica", "normal");
             doc.setTextColor(60, 60, 60); // Dark Gray
             const aPrefix = `Answer: `;
             const aLines = doc.splitTextToSize(aPrefix + q.answer, maxLineWidth);
             checkPageBreak(aLines.length * 6 + 10);
             doc.text(aLines, margin, y);
             y += aLines.length * 6 + 5;
             
             if (q.diagramSvg) {
                checkPageBreak(10);
                doc.setFontSize(10);
                doc.setTextColor(100, 100, 150);
                doc.text("[Diagram available in web version]", margin, y);
                y += 8;
             }

             y += 8;
        });
        
        y += 10;
    };

    const addQuizSection = (title: string, questions: QuizQuestion[]) => {
        if (!questions || questions.length === 0) return;

        checkPageBreak(25);
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text(title, margin, y);
        y += 10;

        doc.setLineWidth(0.5);
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, y, pageWidth - margin, y);
        y += 10;

        questions.forEach((q, i) => {
             doc.setFontSize(12);
             doc.setFont("helvetica", "bold");
             doc.setTextColor(0, 0, 0);
             const qPrefix = `Q${i + 1}. `;
             const qLines = doc.splitTextToSize(qPrefix + q.question, maxLineWidth);
             checkPageBreak(qLines.length * 7 + 30); // Approx height for question + options
             doc.text(qLines, margin, y);
             y += qLines.length * 7 + 3;

             doc.setFont("helvetica", "normal");
             doc.setTextColor(60, 60, 60);
             
             q.options.forEach((opt, idx) => {
                const optPrefix = `${String.fromCharCode(65+idx)}) `;
                const optLines = doc.splitTextToSize(optPrefix + opt, maxLineWidth - 10);
                doc.text(optLines, margin + 5, y);
                y += optLines.length * 6 + 2;
             });
             
             // Answer key at bottom of question (or could be at end of PDF)
             y += 2;
             doc.setFont("helvetica", "italic");
             doc.setTextColor(0, 100, 0);
             doc.text(`Correct: ${q.correctAnswer}`, margin + 5, y);

             y += 10;
        });
        y += 10;
    };

    addSection("Part A: 2 Marks Questions", data.shortQuestions);
    addSection("Part B: 7 Marks Questions", data.longQuestions);
    if (data.quizQuestions) addQuizSection("Part C: Quiz / MCQs", data.quizQuestions);

    const filename = (data.topic || 'exam').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    doc.save(`${filename}.pdf`);
  };

  const totalQuestions = data.shortQuestions.length + data.longQuestions.length + (data.quizQuestions?.length || 0);

  return (
    <div className="w-full max-w-4xl mx-auto animate-fade-in-up">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-6 md:p-8 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">{data.topic || "Generated Exam Questions"}</h2>
              <p className="text-slate-500 mt-1">
                Generated {totalQuestions} questions from your document
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button 
                onClick={copyToClipboard}
                className="flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-800 transition-all shadow-sm"
              >
                {copied ? <Check className="w-4 h-4 mr-2 text-green-500" /> : <Copy className="w-4 h-4 mr-2" />}
                {copied ? "Copied" : "Copy"}
              </button>
              
              <button 
                onClick={handleDownloadPDF}
                className="flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-all shadow-sm"
              >
                <Download className="w-4 h-4 mr-2" />
                PDF
              </button>

              <button 
                onClick={handleDownloadMarkdown}
                className="flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-800 transition-all shadow-sm"
              >
                <FileText className="w-4 h-4 mr-2" />
                Markdown
              </button>

              <button 
                onClick={onReset}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm ml-auto"
              >
                New
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 overflow-x-auto">
          {data.shortQuestions.length > 0 && (
            <button
              onClick={() => setActiveTab('short')}
              className={`flex-1 py-4 px-4 text-sm font-medium text-center transition-colors relative whitespace-nowrap ${
                activeTab === 'short' ? 'text-blue-600 bg-blue-50/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <BookOpen className="w-4 h-4" />
                2 Marks (Short)
                <span className="bg-blue-100 text-blue-700 text-xs py-0.5 px-2 rounded-full ml-1">
                  {data.shortQuestions.length}
                </span>
              </div>
              {activeTab === 'short' && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600" />
              )}
            </button>
          )}
          {data.longQuestions.length > 0 && (
            <button
              onClick={() => setActiveTab('long')}
              className={`flex-1 py-4 px-4 text-sm font-medium text-center transition-colors relative whitespace-nowrap ${
                activeTab === 'long' ? 'text-purple-600 bg-purple-50/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <GraduationCap className="w-4 h-4" />
                7 Marks (Detailed)
                <span className="bg-purple-100 text-purple-700 text-xs py-0.5 px-2 rounded-full ml-1">
                  {data.longQuestions.length}
                </span>
              </div>
              {activeTab === 'long' && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-600" />
              )}
            </button>
          )}
          {data.quizQuestions && data.quizQuestions.length > 0 && (
            <button
              onClick={() => setActiveTab('quiz')}
              className={`flex-1 py-4 px-4 text-sm font-medium text-center transition-colors relative whitespace-nowrap ${
                activeTab === 'quiz' ? 'text-emerald-600 bg-emerald-50/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Quiz (MCQs)
                <span className="bg-emerald-100 text-emerald-700 text-xs py-0.5 px-2 rounded-full ml-1">
                  {data.quizQuestions.length}
                </span>
              </div>
              {activeTab === 'quiz' && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-600" />
              )}
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 bg-slate-50/50 min-h-[400px]">
          {activeTab === 'short' && (
             data.shortQuestions.length > 0 ? (
              <div className="space-y-4">
                <div className="mb-4 p-4 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800">
                  These questions are designed to test quick recall and basic definitions. Aim for 2-3 sentences per answer.
                </div>
                {data.shortQuestions.map((qa, index) => (
                  <QuestionItem key={`short-${index}`} qa={qa} index={index} type="short" />
                ))}
              </div>
             ) : (
               <div className="text-center py-10 text-slate-500">No short questions generated.</div>
             )
          )}
          
          {activeTab === 'long' && (
             data.longQuestions.length > 0 ? (
              <div className="space-y-4">
                <div className="mb-4 p-4 bg-purple-50 border border-purple-100 rounded-lg text-sm text-purple-800">
                   These questions require detailed explanation, analysis, or step-by-step working. Aim for comprehensive paragraph answers.
                </div>
                {data.longQuestions.map((qa, index) => (
                  <QuestionItem key={`long-${index}`} qa={qa} index={index} type="long" />
                ))}
              </div>
             ) : (
                <div className="text-center py-10 text-slate-500">No long questions generated.</div>
             )
          )}

          {activeTab === 'quiz' && (
             data.quizQuestions && data.quizQuestions.length > 0 ? (
              <div className="space-y-4">
                <div className="mb-4 p-4 bg-emerald-50 border border-emerald-100 rounded-lg text-sm text-emerald-800">
                   Test your knowledge with these multiple choice questions. Click an option to select it.
                </div>
                {data.quizQuestions.map((q, index) => (
                  <QuizItem key={`quiz-${index}`} question={q} index={index} />
                ))}
              </div>
             ) : (
                <div className="text-center py-10 text-slate-500">No quiz questions generated.</div>
             )
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultDisplay;