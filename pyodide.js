let pyodide;

async function initializePyodide() {
  pyodide = await loadPyodide();  // Remove the 'let' declaration here
  // Pyodide is now ready to use...
  console.log(pyodide.runPython(`
    import sys
    sys.version
  `));
}

async function runPythonCode(code) {
  if (!pyodide) {
    await initializePyodide();
  }

  try {
    return await pyodide.runPythonAsync(code);
  } catch (error) {
    console.error("Error running Python code:", error);
    throw error;
  }
}

export { runPythonCode };
