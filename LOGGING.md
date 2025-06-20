# PDF Organiser - Logging & Debugging Guide

## Accessing Logs in Different Environments

### 1. Development Mode

**Console Logs:**
- Run `npm start` + `npm run electron` 
- Dev tools are automatically opened
- All logs appear in the browser console

**File Logs:**
- Logs are also written to: `~/Library/Application Support/PDF Organiser/logs/main.log` (macOS)
- Use `npm run logs:open` to open the logs folder

### 2. Production/Packaged App

**Option 1: Debug Mode (Recommended)**
```bash
# Build and run with dev tools enabled
npm run electron:debug
```
This will:
- Build the production version
- Run with `--debug` flag to open dev tools
- Allow you to see console logs and inspect the app

**Option 2: Menu Access**
- In the packaged app, go to **View → Open Log Folder**
- This opens the logs directory in your file explorer
- View `main.log` for Electron main process logs

**Option 3: Manual Log Location**
Navigate to the logs folder manually:

**macOS:**
```
~/Library/Application Support/PDF Organiser/logs/main.log
```

**Windows:**
```
%APPDATA%/PDF Organiser/logs/main.log
```

**Linux:**
```
~/.config/PDF Organiser/logs/main.log
```

**Option 4: npm Script**
```bash
npm run logs:open
```

### 3. Log Levels

The app uses different log levels:
- **ERROR**: Critical errors that prevent functionality
- **WARN**: Warning messages (e.g., dev server connection issues)
- **INFO**: General information (file operations, app state)
- **DEBUG**: Detailed debugging information

### 4. What's Logged

**Main Process (Electron):**
- Application startup/shutdown
- File operations (open, save, read, write)
- IPC communication
- Menu interactions
- Window management

**Renderer Process (Angular):**
- PDF loading and processing
- Page manipulation operations
- User interactions
- Service lifecycle events

### 5. Debugging Tips

**For File Association Issues:**
1. Check logs for "File opened via open-file event" messages
2. Look for command line argument parsing logs
3. Verify Angular ready signals

**For PDF Processing Issues:**
1. Look for "PDF Service" prefixed messages
2. Check for PDF.js worker initialization logs
3. Monitor file buffer operations

**For Performance Issues:**
1. Enable debug mode: `npm run electron:debug`
2. Use Chrome DevTools Performance tab
3. Monitor memory usage in Task Manager

### 6. Log Rotation

- Logs are automatically rotated by electron-log
- Maximum file size: 1MB (default)
- Maximum number of files: 5 (default)
- Old logs are automatically compressed

### 7. Troubleshooting Common Issues

**No logs appearing:**
- Ensure electron-log is properly installed
- Check file permissions for the logs directory
- Verify the app has write access to user data directory

**Logs folder doesn't exist:**
- Run the app at least once to create the directory
- Check if antivirus is blocking file creation

**Can't open logs folder from menu:**
- Try the manual path or npm script
- Check if the shell integration is working

### 8. Custom Logging

To add your own logs in the Angular code:
```typescript
// This will log to both console and file
console.log('Your message', data);

// For Electron-specific logging:
if (window.electronAPI) {
  window.electronAPI.log('info', 'Your message', data);
}
``` 
