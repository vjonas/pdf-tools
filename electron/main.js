const { app, BrowserWindow, Menu, dialog, ipcMain } = require("electron");
const path = require("path");
const { readFile, writeFile } = require("fs").promises;
const { spawn } = require("child_process");
const log = require("electron-log");

// Configure electron-log
log.transports.file.level = "info";
log.transports.console.level = "debug";

// Set custom log file location
log.transports.file.resolvePathFn = () => {
  return path.join(app.getPath("userData"), "logs", "main.log");
};

// Log application startup
log.info("Application starting...");

let mainWindow;
let angularProcess;
let fileToOpen = null; // Store file path if opened before window is ready
let isAngularReady = false; // Track if Angular app is ready to receive messages

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, "preload.js"),
    },
    icon: path.join(__dirname, "../assets/icon.png"),
    show: false,
  });

  // Load the Angular app
  const isDev =
    process.env.NODE_ENV === "development" || process.argv.includes("--dev");

  // Open dev tools in development or when --debug flag is passed
  if (isDev || process.argv.includes("--debug")) {
    mainWindow.webContents.openDevTools();
  }
  if (isDev) {
    // Development mode - load from Angular dev server
    mainWindow.loadURL("http://localhost:4200");
    mainWindow.webContents.openDevTools();

    // Handle dev server connection errors
    mainWindow.webContents.on("did-fail-load", () => {
      log.warn(
        "Failed to load Angular dev server. Make sure ng serve is running."
      );
      setTimeout(() => {
        mainWindow.loadURL("http://localhost:4200");
      }, 2000);
    });
  } else {
    // Production mode - load built Angular app
    const indexPath = path.join(__dirname, "../dist/browser/index.html");
    mainWindow.loadFile(indexPath);
  }

  // Show window when ready to prevent visual flash
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();

    if (isDev) {
      log.info("PDF Organiser running in development mode");
    } else {
      log.info("PDF Organiser running in production mode");
    }

    // File opening will be handled when Angular signals it's ready
  });

  // Create application menu
  const template = [
    {
      label: "File",
      submenu: [
        {
          label: "Open PDF",
          accelerator: "CmdOrCtrl+O",
          click: () => {
            dialog
              .showOpenDialog(mainWindow, {
                properties: ["openFile"],
                filters: [{ name: "PDF Files", extensions: ["pdf"] }],
              })
              .then((result) => {
                if (!result.canceled && result.filePaths.length > 0) {
                  mainWindow.webContents.send(
                    "file-opened",
                    result.filePaths[0]
                  );
                }
              });
          },
        },
        {
          label: "Save PDF",
          accelerator: "CmdOrCtrl+S",
          click: () => {
            mainWindow.webContents.send("save-pdf");
          },
        },
        { type: "separator" },
        {
          label: "Exit",
          accelerator: process.platform === "darwin" ? "Cmd+Q" : "Ctrl+Q",
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        {
          label: "Open Log Folder",
          click: () => {
            const { shell } = require("electron");
            const logPath = path.join(app.getPath("userData"), "logs");
            shell.openPath(logPath);
          },
        },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    {
      label: "Window",
      submenu: [{ role: "minimize" }, { role: "close" }],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Function to open a file in the app
function openFileInApp(filePath) {
  if (mainWindow && mainWindow.webContents && isAngularReady) {
    log.info("Opening file:", filePath);
    mainWindow.webContents.send("file-opened", filePath);
    fileToOpen = null;
  } else {
    log.info("Storing file to open when Angular is ready:", filePath);
    // Store the file path to open later when Angular is ready
    fileToOpen = filePath;
  }
}

// IPC handlers for file operations
ipcMain.handle("read-pdf-file", async (event, filePath) => {
  try {
    const fileBuffer = await readFile(filePath);
    return fileBuffer;
  } catch (error) {
    log.error("Error reading PDF file:", error);
    throw error;
  }
});

ipcMain.handle("save-pdf-file", async (event, filePath, pdfBuffer) => {
  try {
    await writeFile(filePath, pdfBuffer);
    return { success: true };
  } catch (error) {
    log.error("Error saving PDF file:", error);
    throw error;
  }
});

ipcMain.handle("show-save-dialog", async () => {
  const result = await dialog.showSaveDialog(mainWindow, {
    filters: [{ name: "PDF Files", extensions: ["pdf"] }],
  });
  return result;
});

ipcMain.handle("show-open-dialog", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile"],
    filters: [{ name: "PDF Files", extensions: ["pdf"] }],
  });
  return result;
});

ipcMain.handle("show-directory-dialog", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"],
  });
  return result;
});

// Handle Angular app ready signal
ipcMain.handle("angular-ready", async () => {
  log.info("Angular app is ready, file to open:", fileToOpen);
  isAngularReady = true;

  // If there's a file waiting to be opened, open it now
  if (fileToOpen) {
    log.info("Opening stored file:", fileToOpen);
    mainWindow.webContents.send("file-opened", fileToOpen);
    fileToOpen = null;
  }

  return { success: true };
});

// Handle log messages from renderer process
ipcMain.handle("log-message", async (event, level, message, data) => {
  const logMessage = `[Renderer] ${message}`;

  switch (level) {
    case "error":
      log.error(logMessage, data);
      break;
    case "warn":
      log.warn(logMessage, data);
      break;
    case "info":
      log.info(logMessage, data);
      break;
    case "debug":
    default:
      log.debug(logMessage, data);
      break;
  }
});

// App event handlers
app.whenReady().then(() => {
  createWindow();

  // Check if a file was passed as command line argument or stored from open-file event
  const commandLineFilePath = getFileFromCommandLine();
  if (commandLineFilePath) {
    openFileInApp(commandLineFilePath);
  } else if (fileToOpen) {
    // File was stored from open-file event before app was ready
    openFileInApp(fileToOpen);
    // fileToOpen = null;
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Handle file opening on macOS (when file is double-clicked or dropped on dock icon)
app.on("open-file", (event, filePath) => {
  event.preventDefault();
  log.info("File opened via open-file event:", filePath);

  if (path.extname(filePath).toLowerCase() === ".pdf") {
    if (app.isReady()) {
      if (mainWindow) {
        openFileInApp(filePath);
      } else {
        createWindow();
        fileToOpen = filePath;
      }
    } else {
      // App is not ready yet, store the file to open when ready
      fileToOpen = filePath;
    }
  }
});

// Handle second instance (when app is already running and user tries to open another file)
app.on("second-instance", (event, commandLine, workingDirectory) => {
  // Someone tried to run a second instance, focus our window and open the file
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();

    // Check if a file was passed in the second instance
    const filePath = getFileFromCommandLine(commandLine);
    if (filePath) {
      openFileInApp(filePath);
    }
  }
});

// Prevent multiple instances (except when opening files)
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

// Function to extract PDF file path from command line arguments
function getFileFromCommandLine(commandLine = process.argv) {
  // Look for PDF files in command line arguments
  const pdfFiles = commandLine.filter(
    (arg) => arg.endsWith(".pdf") && require("fs").existsSync(arg)
  );

  return pdfFiles.length > 0 ? pdfFiles[0] : null;
}

// Security: Prevent new window creation
app.on("web-contents-created", (event, contents) => {
  contents.on("new-window", (navigationEvent, navigationUrl) => {
    navigationEvent.preventDefault();
  });
});
