const { contextBridge, ipcRenderer } = require("electron");

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
  // File operations
  readPdfFile: (filePath) => ipcRenderer.invoke("read-pdf-file", filePath),
  savePdfFile: (filePath, pdfBuffer) =>
    ipcRenderer.invoke("save-pdf-file", filePath, pdfBuffer),
  showSaveDialog: () => ipcRenderer.invoke("show-save-dialog"),
  showOpenDialog: () => ipcRenderer.invoke("show-open-dialog"),
  showDirectoryDialog: () => ipcRenderer.invoke("show-directory-dialog"),

  // Event listeners
  onFileOpened: (callback) => ipcRenderer.on("file-opened", callback),
  onSavePdf: (callback) => ipcRenderer.on("save-pdf", callback),

  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),

  // Signal that Angular is ready
  signalAngularReady: () => ipcRenderer.invoke("angular-ready"),

  // Platform info
  platform: process.platform,

  // Logging - forward renderer logs to main process
  log: (level, message, data) =>
    ipcRenderer.invoke("log-message", level, message, data),
});
