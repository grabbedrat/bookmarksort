// pyodide.js
let pyodide;

async function initializePyodide() {
  try {
    pyodide = await loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.18.1/full/",
    });
    console.log("Pyodide loaded successfully!");
  } catch (error) {
    console.error("Failed to load Pyodide:", error);
    throw error;
  }
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