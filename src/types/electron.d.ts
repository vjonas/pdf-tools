export interface ElectronAPI {
  // File operations
  readPdfFile: (filePath: string) => Promise<Buffer>;
  savePdfFile: (
    filePath: string,
    pdfBuffer: Uint8Array
  ) => Promise<{ success: boolean }>;
  showSaveDialog: () => Promise<{ canceled: boolean; filePath?: string }>;
  showOpenDialog: () => Promise<{ canceled: boolean; filePaths: string[] }>;
  showDirectoryDialog: () => Promise<{
    canceled: boolean;
    filePaths: string[];
  }>;

  // Event listeners
  onFileOpened: (callback: (event: any, filePath: string) => void) => void;
  onSavePdf: (callback: (event: any) => void) => void;

  // Remove listeners
  removeAllListeners: (channel: string) => void;

  // Signal that Angular is ready
  signalAngularReady: () => Promise<{ success: boolean }>;

  // Platform info
  platform: string;

  // Logging
  log: (
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    data?: any
  ) => Promise<void>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
