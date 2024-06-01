// bookmarkProcessing.js
import { runPythonCode } from "./pyodide.js";

async function processBookmarks(bookmarks) {
  const pythonCode = `
    # Python code for preprocessing bookmarks
    print('Hello world!')
  `;

  const processedBookmarks = await runPythonCode(pythonCode);
  return processedBookmarks;
}

export { processBookmarks };