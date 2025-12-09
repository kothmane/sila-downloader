# Sila Downloader

A modern Electron application built with React and Tailwind CSS for downloading files.

## Features

- **Modern UI**: Built with React and styled with Tailwind CSS
- **TypeScript Support**: Full TypeScript integration for better development experience
- **Electron Framework**: Cross-platform desktop application
- **Hot Reload**: Development server with hot reload capabilities
- **Download Management**: Clean interface for managing downloads

## Technologies Used

- **Electron**: ^37.2.6
- **React**: ^19.1.1
- **TypeScript**: ^5.9.2
- **Tailwind CSS**: ^4.1.11
- **Webpack**: ^5.101.0

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

All dependencies are already installed. The project is ready to run!

### Development

To start the development server:

```bash
npm run dev
```

This will:
1. Start the webpack dev server on http://localhost:3000
2. Launch the Electron app
3. Enable hot reload for development

### Build for Production

To build the application:

```bash
npm run build
```

### Project Structure

```
sila-downloader/
├── src/
│   ├── main/
│   │   └── main.js          # Main Electron process
│   └── renderer/
│       ├── App.tsx          # Main React component
│       ├── index.tsx        # React entry point
│       ├── index.html       # HTML template
│       └── styles.css       # Tailwind CSS imports
├── webpack.config.js        # Webpack configuration
├── tailwind.config.js       # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Project dependencies and scripts
```

## Available Scripts

- `npm run dev` - Start development mode
- `npm run dev:renderer` - Start only the renderer process (React app)
- `npm run dev:electron` - Start only the Electron app
- `npm run build` - Build for production
- `npm run build:electron` - Build and package with electron-builder

## Development Notes

- The main process is in `src/main/main.js`
- The renderer process (React app) is in `src/renderer/`
- Tailwind CSS is configured and ready to use
- TypeScript is set up with strict mode enabled
- Hot reload is enabled in development mode

## Next Steps

You can now:
1. Run `npm run dev` to start the application
2. Modify the React components in `src/renderer/`
3. Add additional Electron features in `src/main/main.js`
4. Customize the Tailwind configuration in `tailwind.config.js`
