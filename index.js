(function () {
  const originalConsole = {};
  let target;
  if (document.getElementById('console-output')) {
    target = document.getElementById('console-output');
  } else {
    target = document.createElement('div');
    target.id = 'console-output';
    target.style.position = 'fixed';
    target.style.bottom = '0';
    target.style.left = '0';
    target.style.backgroundColor = '#f8f8f8';
    target.style.padding = '10px';
    target.style.border = '1px solid #ccc';
    target.style.whiteSpace = 'pre';
    target.style.width = '100%';
    target.style.maxHeight = '300px';
    target.style.overflowY = 'auto';
    target.style.zIndex = '1000'; // Ensure it stays on top
    document.body.appendChild(target);
  }
  const methods = ['log', 'info', 'error', 'warn', 'debug'];

  // Function to format arguments
  const formatArg = (arg) => {
    if (arg instanceof Error) {
      return `Error: ${arg.message}\nStack: ${arg.stack}`;
    } else if (typeof arg === 'object') {
      try {
        return JSON.stringify(arg, null, 2);
      } catch (e) {
        return `{ object: [circular reference?] }`;
      }
    } else {
      return arg;
    }
  };

  // Function to format and append logs to the target element
  const logToTarget = function (method, ...args) {
    const formattedArgs = args.map(formatArg).join(' '); // Removed unnecessary .bind call
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${method.toUpperCase()}] ${timestamp}: ${formattedArgs}\n\n`;
    this.textContent += logEntry;
  };

  // Bind logToTarget to the target element
  const boundLogger = logToTarget.bind(target);

  // Override console methods
  methods.forEach((method) => {
    originalConsole[method] = console[method];
    console[method] = function (...args) {
      if (originalConsole[method]) {
        originalConsole[method].apply(console, args);
      }
      boundLogger(method, ...args);
      return originalConsole[method]
        ? originalConsole[method].apply(console, args)
        : undefined;
    };
  });

  // Capture uncaught exceptions
  window.onerror = function (message, source, lineno, colno, error) {
    const timestamp = new Date().toLocaleTimeString();
    const formattedError = error
      ? `Error: ${error.message}\nStack: ${error.stack}`
      : message;
    const logEntry = `[UNCAUGHT EXCEPTION] ${timestamp}:\n${formattedError}\n`;
    target.textContent += logEntry;
    return true; // Prevent default error handling
  };

  // Capture unhandled promise rejections
  window.onunhandledrejection = function (event) {
    const error = event.reason;
    const timestamp = new Date().toLocaleTimeString();
    const logEntry =
      `[UNHANDLED REJECTION] ${timestamp}:\n` +
      `Error: ${error.message}\nStack: ${
        error.stack || '(no stack available)'
      }\n`;
    target.textContent += logEntry;
    return true;
  };

  // Cleanup function (optional)
  return {
    stop: function () {
      methods.forEach((method) => {
        console[method] = originalConsole[method];
      });
      window.onerror = null;
      window.onunhandledrejection = null;
    },
  };
})();
