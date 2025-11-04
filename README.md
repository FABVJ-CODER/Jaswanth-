# AI Aggregator Frontend

A modern, responsive web application that provides an intuitive interface for interacting with multiple AI services. Users can submit queries, select AI services, and receive comprehensive aggregated solutions with code generation and implementation guides.

## Features

- **Modern UI/UX**: Clean, responsive design with dark/light theme support
- **Query Analysis**: Intelligent analysis of user queries with AI service recommendations
- **Multi-Service Selection**: Interactive service selection modal with confidence scores
- **Real-time Progress**: Live progress tracking for AI service processing
- **Tabbed Results**: Organized display of aggregated solutions, individual responses, generated code, and implementation guides
- **Code Highlighting**: Syntax highlighting for multiple programming languages
- **Export Functionality**: Export results to Markdown, HTML, JSON, and PDF formats
- **Session History**: Query history with search and filtering capabilities
- **Responsive Design**: Mobile-first design that works on all devices

## Quick Start

### Prerequisites

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Node.js 18+ (for development)
- AI Aggregator Backend API running

### Development Setup

1. **Navigate to the frontend directory**
```bash
cd Jaswanth-
```

2. **Start a development server**
```bash
# Option 1: Using Python's built-in server
python -m http.server 8080

# Option 2: Using Node.js http-server
npx http-server -p 8080

# Option 3: Using live-server for auto-reloading
npx live-server --port=8080
```

3. **Open the application**
Navigate to `http://localhost:8080` in your browser

### Production Deployment

The frontend is designed to work with any static web server or CDN. For production:

1. **Build the application** (if using build tools)
2. **Deploy to web server** (Nginx, Apache, CDN, etc.)
3. **Configure API proxy** to point to the backend API

## Architecture

### Directory Structure

```
Jaswanth-/
├── index.html           # Main application entry point
├── css/
│   └── style.css        # Complete application styles
├── js/
│   ├── app.js          # Main application logic
│   └── utils.js        # Utility functions
├── Dockerfile          # Docker configuration
└── README.md           # This file
```

### Key Components

#### HTML Structure (`index.html`)
- Semantic HTML5 structure
- Responsive meta tags
- Accessibility features (ARIA labels)
- Progressive enhancement

#### CSS Styling (`css/style.css`)
- Modern CSS with custom properties
- Mobile-first responsive design
- Dark/light theme support
- Smooth animations and transitions
- Component-based organization

#### JavaScript Modules
- **app.js**: Main application logic, API communication, UI interactions
- **utils.js**: Helper functions, validation, file operations

### External Dependencies

The application uses minimal external dependencies:

- **Google Fonts**: Inter font family
- **Highlight.js** (optional): Code syntax highlighting
- **jsPDF** (optional): PDF export functionality

## Configuration

### API Configuration

The application automatically detects the API base URL:
- Development: `http://localhost:5000/api`
- Production: `/api` (relative path)

### Theme Configuration

Themes are managed through CSS custom properties and localStorage:
- Light theme (default)
- Dark theme (user preference)

### Session Management

Sessions are managed using localStorage with automatic session ID generation.

## Features in Detail

### Query Interface
- Large textarea with character counter (5000 char limit)
- Real-time input validation
- Quick action templates for common query types
- Auto-save draft functionality

### AI Service Selection
- Modal-based service selection
- Confidence scores and timing estimates
- Service capability descriptions
- Advanced options (temperature, response length, code generation)

### Progress Tracking
- Overall progress bar
- Individual service progress indicators
- Real-time status updates
- Estimated completion times

### Results Display
- **Aggregated Solution**: Combined insights from all AI services
- **Individual Responses**: Separate tabs for each AI service response
- **Generated Code**: Syntax-highlighted code files with copy/download functionality
- **Implementation Guide**: Step-by-step instructions with prerequisites and run commands

### Export Options
- **Markdown**: Complete results in Markdown format
- **HTML**: Styled HTML document with print support
- **JSON**: Raw response data for programmatic use
- **PDF**: Formatted PDF document (requires jsPDF)

### Session History
- Local query history storage
- Search and filter functionality
- Quick access to previous results
- Export history functionality

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance Optimization

- Lazy loading of external libraries
- Efficient DOM manipulation
- Minimal external dependencies
- Optimized CSS with hardware acceleration
- Service Worker support (for future PWA features)

## Security Features

- Input sanitization and validation
- XSS protection
- Content Security Policy ready
- HTTPS enforcement in production
- Secure API communication

## Accessibility

- WCAG 2.1 AA compliance
- Semantic HTML structure
- ARIA labels and landmarks
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support

## Development Tools

### Code Quality
- ESLint configuration for JavaScript
- CSS linting with stylelint
- HTML validation
- Browser compatibility testing

### Debugging
- Console logging with different levels
- Error boundary handling
- Performance monitoring
- Network request debugging

## Deployment Options

### Static Hosting
- Netlify
- Vercel
- GitHub Pages
- AWS S3 + CloudFront
- Firebase Hosting

### Server Deployment
- Nginx configuration included
- Apache .htaccess support
- Docker containerization
- Kubernetes deployment

## Customization

### Theming
- CSS custom properties for easy color customization
- Modular CSS structure
- Component-based styling

### Branding
- Easy logo and color scheme updates
- Customizable service descriptions
- Flexible layout system

### API Integration
- Pluggable API client
- Custom endpoint configuration
- Authentication method flexibility

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test across browsers
5. Ensure accessibility compliance
6. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the troubleshooting section below

## Troubleshooting

### Common Issues

1. **API Connection Errors**
   - Verify backend API is running
   - Check CORS configuration
   - Ensure correct API URL

2. **Code Highlighting Not Working**
   - Check internet connection for external library loading
   - Verify correct language classes
   - Check browser console for errors

3. **Export Functionality Issues**
   - Ensure sufficient browser permissions
   - Check for popup blockers
   - Verify file download settings

4. **Theme Switching Problems**
   - Clear browser localStorage
   - Check for CSS loading errors
   - Verify browser compatibility

### Debug Mode

Enable debug mode by adding `?debug=true` to the URL for additional logging and debugging information.