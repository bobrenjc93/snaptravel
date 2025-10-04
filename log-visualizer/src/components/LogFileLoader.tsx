import React, { useCallback, useState } from 'react';

interface LogFileLoaderProps {
  onLogLoad: (content: string) => void;
  className?: string;
}

const LogFileLoader: React.FC<LogFileLoaderProps> = ({
  onLogLoad,
  className = ''
}) => {
  const [textInput, setTextInput] = useState(`{"class": "_SymNodeDict", "method": "__setitem__", "changes": {"sym_node_dict": {"before": {}, "after": {"s57": "<object object at 0x1012a03e0>"}}}, "backtrace": [{"file": "/Users/bobren/projects/snaptravel/snapshot_tracer.py", "line": 205, "function": "<module>", "code": "main()"}, {"file": "/Users/bobren/projects/snaptravel/snapshot_tracer.py", "line": 192, "function": "main", "code": "tracer.add_sym(\\"s57\\", object())"}, {"file": "/Users/bobren/projects/snaptravel/snapshot_tracer.py", "line": 93, "function": "wrapper", "code": "result = func(self, *args, **kwargs)"}]}
{"class": "PythonKeyTracer", "method": "add_sym", "changes": {"symnode_tracker": {"before": {"__class__": "_SymNodeDict", "sym_node_dict": {}}, "after": {"__class__": "_SymNodeDict", "sym_node_dict": {"s57": "<object object at 0x1012a03e0>"}}}}, "backtrace": [{"file": "/Users/bobren/projects/snaptravel/snapshot_tracer.py", "line": 205, "function": "<module>", "code": "main()"}]}
{"class": "_SymNodeDict", "method": "__setitem__", "changes": {"sym_node_dict": {"before": {"s57": "<object object at 0x1012a03e0>"}, "after": {"s57": "<object object at 0x1012a03e0>", "s99": [1, 2, 3]}}}, "backtrace": [{"file": "/Users/bobren/projects/snaptravel/snapshot_tracer.py", "line": 205, "function": "<module>", "code": "main()"}, {"file": "/Users/bobren/projects/snaptravel/snapshot_tracer.py", "line": 193, "function": "main", "code": "tracer.add_sym(\\"s99\\", [1, 2, 3])"}, {"file": "/Users/bobren/projects/snaptravel/snapshot_tracer.py", "line": 93, "function": "wrapper", "code": "result = func(self, *args, **kwargs)"}]}
{"class": "PythonKeyTracer", "method": "toggle", "changes": {"enable_thunkify": {"before": false, "after": true}}, "backtrace": [{"file": "/Users/bobren/projects/snaptravel/snapshot_tracer.py", "line": 205, "function": "<module>", "code": "main()"}]}`);

  const handleTextSubmit = useCallback(() => {
    if (textInput.trim()) {
      onLogLoad(textInput.trim());
    }
  }, [textInput, onLogLoad]);

  const handleLoadSample = useCallback(() => {
    const sampleLog = `{"class": "MyClass", "method": "increment", "changes": {"x": {"before": 10, "after": 15}, "y": {"before": 0, "after": 1}}}
{"class": "MyClass", "method": "add_to_history", "changes": {"history": {"before": [], "after": ["first"]}}}
{"class": "MyClass", "method": "add_to_history", "changes": {"history": {"before": ["first"], "after": ["first", "second"]}}}
{"class": "MyClass", "method": "reset", "changes": {"x": {"before": 15, "after": 0}, "y": {"before": 1, "after": 0}, "history": {"before": ["first", "second"], "after": []}}}`;
    setTextInput(sampleLog);
  }, []);

  const handleLoadLive = useCallback(async () => {
    try {
      const response = await fetch('/api/logs');
      const data = await response.json();

      if (data.entries && data.entries.length > 0) {
        const logContent = data.entries.map((entry: any) => JSON.stringify(entry)).join('\n');
        setTextInput(logContent);
      } else {
        alert('No live log data found. Run snapshot_tracer.py to generate logs.');
      }
    } catch (error) {
      console.error('Failed to load live logs:', error);
      alert('Failed to load live logs. Make sure the server is running.');
    }
  }, []);

  const handleLoadAndAnalyzeLive = useCallback(async () => {
    try {
      const response = await fetch('/api/logs');
      const data = await response.json();

      if (data.entries && data.entries.length > 0) {
        const logContent = data.entries.map((entry: any) => JSON.stringify(entry)).join('\n');
        onLogLoad(logContent);
      } else {
        alert('No live log data found. Run snapshot_tracer.py to generate logs.');
      }
    } catch (error) {
      console.error('Failed to load live logs:', error);
      alert('Failed to load live logs. Make sure the server is running.');
    }
  }, [onLogLoad]);

  return (
    <div className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8 shadow-sm ${className}`}>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 mb-2">
          Python State Debugger
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 text-sm">
          Paste your @snapshot_class logs to visualize state changes over time
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label htmlFor="text-input" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
            Log content
          </label>
          <textarea
            id="text-input"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Paste your log content here..."
            rows={10}
            className="block w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:border-transparent resize-none transition-all duration-200"
          />
          <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-2">
            Each line should be a JSON object with class, method, and changes fields
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleTextSubmit}
            disabled={!textInput.trim()}
            className="flex-1 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 disabled:hover:bg-zinc-900 dark:disabled:hover:bg-zinc-100"
          >
            Analyze Logs
          </button>
          <button
            onClick={handleLoadAndAnalyzeLive}
            className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-all duration-200"
          >
            Load Live Logs
          </button>
          <button
            onClick={handleLoadSample}
            className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm font-medium rounded-lg transition-all duration-200"
          >
            Example
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogFileLoader;