# Image Text Editor

A professional image text editor built with Next.js, TypeScript, and Fabric.js. Create stunning designs by adding beautiful text overlays to your PNG images.

## 🚀 Features

### Core Functionality
- **PNG Image Upload**: Upload PNG images with automatic aspect ratio matching
- **Multiple Text Layers**: Add unlimited text layers with individual styling
- **Rich Text Editing**: Full control over typography and appearance
- **Transform Tools**: Drag, resize, and rotate text layers with precision
- **Layer Management**: Reorder layers to control stacking order
- **Export**: Save your design as PNG with original dimensions

### Text Styling Options
- **Google Fonts Integration**: Access to 200+ popular Google Fonts
- **Typography Controls**: Font size, weight, color, and opacity
- **Text Alignment**: Left, center, and right alignment
- **Multi-line Support**: Create text blocks with multiple lines
- **Real-time Preview**: See changes instantly as you edit

### Advanced Features
- **Undo/Redo System**: 20+ step history with visual indicator
- **Autosave**: Automatic saving to localStorage
- **Keyboard Shortcuts**: 
  - `Ctrl/Cmd + Z`: Undo
  - `Ctrl/Cmd + Shift + Z` or `Ctrl/Cmd + Y`: Redo
  - `Ctrl/Cmd + T`: Add text layer
  - `Delete/Backspace`: Remove selected layer
- **Snap Guides**: Visual guides for precise positioning
- **Canvas Interactions**: Professional editing experience with Fabric.js

## 🛠️ Technology Stack

- **Framework**: Next.js 13 with App Router
- **Language**: TypeScript
- **Canvas Library**: Fabric.js
- **Styling**: Tailwind CSS + shadcn/ui
- **Color Picker**: react-colorful
- **Icons**: Lucide React
- **Fonts**: Google Fonts API

## 📦 Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd image-text-editor
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🎯 Usage

1. **Upload an Image**: Click "Upload PNG" to select your background image
2. **Add Text**: Click "Add Text" to create a new text layer
3. **Style Your Text**: Use the properties panel to customize font, size, color, etc.
4. **Transform**: Drag, resize, and rotate text layers directly on the canvas
5. **Layer Management**: Reorder layers using the layer panel
6. **Export**: Click "Export" to download your final design as PNG

## 🔧 Architecture

### Key Components
- `useEditor`: Main hook managing canvas state and operations
- `CanvasContainer`: Fabric.js canvas wrapper component
- `Toolbar`: Main toolbar with file and edit operations
- `PropertiesPanel`: Text styling controls
- `fabric-utils`: Canvas manipulation utilities
- `google-fonts`: Font loading and management

### State Management
The editor uses a custom hook (`useEditor`) that manages:
- Canvas instance and fabric objects
- Editor state (layers, selection, dimensions)
- History system for undo/redo
- localStorage persistence

### Design Decisions

**Why Fabric.js?**
- Robust canvas manipulation library
- Excellent text editing capabilities
- Built-in transform controls (resize, rotate)
- Event system for user interactions
- Performance optimized for complex operations

**State Architecture**
- Single source of truth in `useEditor` hook
- Immutable state updates for predictable behavior
- History tracking for undo/redo functionality
- localStorage integration for persistence

**Component Structure**
- Modular design with clear separation of concerns
- Reusable UI components with shadcn/ui
- Custom hooks for complex logic
- TypeScript for type safety

## 🚀 Deployment

The application is optimized for static deployment:

1. Build the application:
```bash
npm run build
```

2. Deploy to Vercel:
```bash
vercel deploy
```

## 🎨 Customization

### Adding New Font Providers
Extend the `google-fonts.ts` utility to support additional font providers:

```typescript
export const loadCustomFont = async (fontUrl: string, fontFamily: string) => {
  // Implementation for custom font loading
};
```

### Custom Transform Tools
Add new transform capabilities by extending the Fabric.js objects:

```typescript
fabric.Text.prototype.customTransform = function() {
  // Custom transformation logic
};
```

### Additional Export Formats
Extend the export functionality to support more formats:

```typescript
export const exportToSVG = (canvas: fabric.Canvas): string => {
  return canvas.toSVG();
};
```

## 🐛 Troubleshooting

### Common Issues

**Canvas not initializing:**
- Ensure Fabric.js is properly imported
- Check console for JavaScript errors
- Verify canvas element is mounted

**Fonts not loading:**
- Check Google Fonts API connectivity
- Verify font names match Google Fonts catalog
- Check browser console for font loading errors

**Export quality issues:**
- Ensure original image dimensions are preserved
- Check canvas scaling factors
- Verify export settings in fabric-utils

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For issues and questions:
- Check the troubleshooting section
- Review existing GitHub issues
- Create a new issue with detailed description

---

Built with ❤️ using Next.js, TypeScript, and Fabric.js