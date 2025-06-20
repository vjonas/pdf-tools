# PDF Organiser

A desktop PDF organizer tool built with Angular and Electron that allows you to view, rearrange, split, and modify PDF documents with an intuitive drag-and-drop interface.

## Features

- 📄 **Open and View PDFs** - Load PDF files and view all pages as thumbnails
- 🔄 **Rearrange Pages** - Drag and drop pages to reorder them
- ➕ **Add/Remove Pages** - Duplicate or delete pages as needed
- ✂️ **Split PDFs** - Split a single PDF into multiple files by page ranges
- 💾 **Save Changes** - Export your modified PDF with all changes
- 🖥️ **Cross-Platform** - Works on Windows, macOS, and Linux
- 🎨 **Modern UI** - Built with PrimeNG for a professional appearance

## Technology Stack

- **Frontend**: Angular 19 with signals and standalone components
- **Desktop**: Electron for cross-platform desktop functionality
- **PDF Processing**: PDF.js for viewing and PDF-lib for manipulation
- **UI Components**: PrimeNG with custom styling
- **TypeScript**: Full type safety throughout the application

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn package manager

## Installation

1. **Clone or download** this project to your local machine

2. **Install dependencies**:
   ```bash
   npm install
   ```

   If you encounter issues with the terminal, you can install the missing dependencies manually:
   ```bash
   npm install pdf-lib pdfjs-dist primeng primeicons @angular/cdk concurrently wait-on
   ```

## Development

### Running in Development Mode

To run the application in development mode with hot reload:

```bash
# Start Angular development server and Electron
npm run electron:dev
```

This will:
1. Start the Angular development server on http://localhost:4200
2. Launch Electron and load the Angular app
3. Open developer tools for debugging

### Running Angular Only (Web Version)

To test the Angular application in a browser:

```bash
npm run start
```

### Running Electron Only

If Angular is already running, you can start Electron separately:

```bash
npm run electron
```

## Building for Production

### Build Angular Application

```bash
npm run build:prod
```

### Package Electron Application

```bash
# Create distributable packages
npm run electron:dist
```

This will create installers for your current platform in the `dist-electron` directory:
- **Windows**: `.exe` installer
- **macOS**: `.dmg` file  
- **Linux**: AppImage

## Project Structure

```
pdf-organiser/
├── electron/
│   ├── main.js          # Electron main process
│   └── preload.js       # Preload script for secure IPC
├── src/
│   ├── app/
│   │   ├── services/
│   │   │   └── pdf.service.ts    # PDF manipulation service
│   │   ├── app.component.ts      # Main application component
│   │   └── app.config.ts         # App configuration
│   ├── types/
│   │   └── electron.d.ts         # Electron API type definitions
│   ├── index.html               # HTML template
│   ├── main.ts                  # Angular bootstrap
│   └── styles.scss              # Global styles
├── dist/                        # Built Angular application
├── dist-electron/               # Electron distribution files
├── package.json                 # Dependencies and scripts
└── README.md                    # This file
```

## Usage

### Opening a PDF

1. **Via Menu**: Use `File > Open PDF` or `Ctrl+O` (Windows/Linux) / `Cmd+O` (macOS)
2. **Via Button**: Click the "Open PDF" button in the toolbar
3. **Via File Upload**: Use the upload button (web version only)

### Organizing Pages

- **Reorder**: Drag and drop page thumbnails to rearrange them
- **Duplicate**: Click the copy icon on any page to duplicate it
- **Delete**: Click the trash icon to remove a page (with confirmation)

### Splitting PDFs

1. Click the "Split PDF" button in the toolbar
2. Define page ranges (e.g., pages 1-3, 4-6, etc.)
3. Specify filenames for each split section
4. Click "Split PDF" to create separate files

### Saving Changes

- **Quick Save**: Use `Ctrl+S` (Windows/Linux) / `Cmd+S` (macOS)
- **Save As**: Click the "Save PDF" button to choose a new location

## Keyboard Shortcuts

- `Ctrl/Cmd + O`: Open PDF file
- `Ctrl/Cmd + S`: Save PDF file
- `F12`: Toggle developer tools (development mode)

## Troubleshooting

### Dependencies Not Installing

If npm install fails, try installing dependencies individually:

```bash
npm install --save pdf-lib pdfjs-dist primeng primeicons @angular/cdk
npm install --save-dev concurrently wait-on
```

### PDF Not Loading

1. Ensure the PDF file is not corrupted
2. Check that the file path doesn't contain special characters
3. Try a different PDF file to isolate the issue

### Electron Not Starting

1. Make sure all dependencies are installed
2. Run `npm run build` before `npm run electron`
3. Check the console for any error messages

## Development Notes

### Adding New Features

1. **PDF Operations**: Extend the `PdfService` class in `src/app/services/pdf.service.ts`
2. **UI Components**: Add new PrimeNG components to the main component
3. **Electron Features**: Modify `electron/main.js` for new desktop functionality

### Code Style

- Uses Angular 19 with signals for reactive state management
- Standalone components (no NgModules)
- TypeScript strict mode enabled
- SCSS for styling with PrimeNG theme

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the ISC License.

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the console logs for error messages  
3. Create an issue with detailed reproduction steps
