let pyodide;

async function initializePyodide() {
  pyodide = await loadPyodide();
  await pyodide.loadPackage("micropip");
  const micropip = pyodide.pyimport("micropip");
  await micropip.install('scikit-learn');
  await micropip.install('numpy');
  await micropip.install('pandas');
  await micropip.install('requests');
  await micropip.install('./hdbscan-0.8.36-cp312-cp312-pyodide_2024_0_wasm32.whl');
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

async function runPythonScript(scriptPath, args) {
  if (!pyodide) {
    await initializePyodide();
  }
  try {
    const response = await fetch(scriptPath);
    const pythonCode = await response.text();
    pyodide.runPython(pythonCode);
    const result = pyodide.globals.get('cluster_bookmarks')(JSON.stringify(args));
    return JSON.parse(result);
  } catch (error) {
    console.error("Error running Python script:", error);
    throw error;
  }
}

export { runPythonCode, runPythonScript };