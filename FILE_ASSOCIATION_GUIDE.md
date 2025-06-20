# PDF File Association Guide

## Overview

Your PDF Organiser app now supports opening PDF files directly from the operating system. Users can:

1. **Right-click a PDF file** → "Open with" → "PDF Organiser"
2. **Double-click a PDF file** (if set as default application)
3. **Drag and drop a PDF file** onto the app icon
4. **Launch the app with a PDF file** as a command line argument

## How It Works

### File Associations
The app registers itself as a PDF viewer through the `electron-builder` configuration in `package.json`:

```json
"fileAssociations": [
  {
    "ext": "pdf",
    "name": "PDF Document",
    "description": "Portable Document Format",
    "role": "Viewer"
  }
]
```

### Event Handling
The main Electron process handles several events:

1. **`open-file`** (macOS) - When a file is opened via Finder
2. **`second-instance`** - When the app is already running and another file is opened
3. **Command line arguments** - When the app is launched with a file path

### Implementation Details

#### Main Process (`electron/main.js`)
- Handles `app.on('open-file')` for macOS file opening
- Processes command line arguments on startup
- Manages single instance behavior with `app.requestSingleInstanceLock()`
- Sends `file-opened` events to the renderer process

#### Preload Script (`electron/preload.js`)
- Exposes `onFileOpened` callback to the renderer process
- Provides secure IPC communication bridge

#### Angular Service (`src/app/services/pdf.service.ts`)
- Listens for `file-opened` events from Electron
- Automatically loads the PDF when a file is opened

## Testing the Feature

### During Development
```bash
# Test with a PDF file as argument
npm run electron:prod -- path/to/your/file.pdf

# Or in development mode
npm run electron -- path/to/your/file.pdf
```

### After Installation
1. **Install the packaged app** from `dist-electron/`
2. **Right-click any PDF file** in your file manager
3. **Select "Open with" → "PDF Organiser"**
4. The app should launch and automatically load the PDF

### Platform-Specific Behavior

#### macOS
- File associations are registered in the app bundle
- Uses `open-file` event for file opening
- Supports drag-and-drop onto dock icon

#### Windows
- File associations are registered during NSIS installation
- Uses command line arguments for file opening
- Appears in "Open with" context menu

#### Linux
- File associations use MIME types
- Integrated with desktop environment file managers

## Troubleshooting

### File Association Not Working
1. **Reinstall the app** - File associations are registered during installation
2. **Check file permissions** - Ensure the PDF file is readable
3. **Verify app installation** - Make sure the app is properly installed

### Multiple Instances
The app prevents multiple instances by default. If a file is opened while the app is running:
- The existing window is focused
- The new file is loaded in the existing instance

### Development vs Production
- **Development**: File opening works but associations aren't registered
- **Production**: Full file association support after installation

## Code References

- **Main process**: `electron/main.js` (lines 160-220)
- **Preload script**: `electron/preload.js` (line 17)
- **Angular service**: `src/app/services/pdf.service.ts` (lines 46-52)
- **Build configuration**: `package.json` (build.fileAssociations) 
