import * as pdfjsLib from 'pdfjs-dist';

// Explicitly set the worker source to the ES Module version on esm.sh.
// This must match the version in index.html (4.10.38) to avoid version mismatches.
// Using esm.sh for both main lib and worker prevents cross-origin and protocol issues.
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://esm.sh/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs';

export const extractTextFromPdf = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // Load the document using the array buffer
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    let fullText = '';
    const numPages = pdf.numPages;

    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      const pageText = textContent.items
        // @ts-ignore - 'str' exists on TextItem
        .map((item) => {
            // Add basic check to ensure item has str property (it's a TextItem)
            return 'str' in item ? item.str : '';
        })
        .join(' ');
      
      fullText += `Page ${i}:\n${pageText}\n\n`;
    }

    return fullText;
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    // Return a clearer error message
    throw new Error(
      error instanceof Error 
        ? `Failed to parse PDF: ${error.message}` 
        : "Failed to parse PDF file. Please ensure it is a valid PDF."
    );
  }
};