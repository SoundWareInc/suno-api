# VS Code Configuration for Suno API

This directory contains VS Code configuration files to enhance your development experience with the Suno API project.

## 📁 Files Overview

### `tasks.json` - Development Tasks
Predefined tasks for common development operations:

- **📦 Install Dependencies** - `npm install`
- **🚀 Start Dev Server** - `npm run dev` (Default build task)
- **🏗️ Build Production** - `npm run build`
- **🌟 Start Production Server** - `npm start`
- **🔍 Lint Code** - `npm run lint`
- **🏥 Test API Health** - Quick health check via curl
- **📤 Test Upload Endpoint** - Test the upload functionality
- **📋 Test Upload Status** - Test upload status endpoint
- **🧪 Run All API Tests** - Run all API tests in sequence
- **🌐 Open API Docs** - Open documentation in browser
- **🏠 Open Home Page** - Open main page in browser
- **📁 Copy .env Template** - Copy `.env.example` to `.env`

### `launch.json` - Debug Configurations
Debug configurations for different scenarios:

- **🚀 Debug Next.js Dev Server** - Full debug with Chrome integration
- **🔗 Attach to Next.js Server** - Attach to running server
- **🌐 Debug Chrome Frontend** - Debug client-side code
- **🔧 Debug API Routes Only** - Focus on API debugging
- **📤 Debug Upload Functionality** - Debug upload-specific code
- **🧪 Debug with Test Request** - Run debug test script
- **🏗️ Debug Production Build** - Debug production version

#### Compound Configurations:
- **🔥 Full Debug Session** - Complete debugging setup
- **🎯 API Development Mode** - API-focused debugging

### `settings.json` - Project Settings
Optimized VS Code settings for this project:

- TypeScript/JavaScript formatting with Prettier
- ESLint integration
- File exclusions for better performance
- Language-specific settings
- Auto-save and format on save
- Debug console optimizations

### `extensions.json` - Recommended Extensions
Essential extensions for Suno API development:

#### Core Development:
- TypeScript/Next.js support
- ESLint & Prettier
- Tailwind CSS IntelliSense

#### API Development:
- REST Client for testing
- OpenAPI/Swagger tools
- Thunder Client

#### Productivity:
- GitLens for Git integration
- Auto-rename tags
- Path IntelliSense
- TODO Tree

## 🚀 Quick Start Guide

### 1. Install Recommended Extensions
When you open the project, VS Code will prompt you to install recommended extensions. Click "Install All" or install them manually from the Extensions panel.

### 2. Run Tasks
Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac) and type:
```
Tasks: Run Task
```

Then select from the available tasks:
- Start with "🚀 Start Dev Server" for development
- Use "🧪 Run All API Tests" to test all endpoints

### 3. Debug the Application
Press `F5` or go to the Debug panel and select:
- "🚀 Debug Next.js Dev Server" for full debugging
- "🔧 Debug API Routes Only" to focus on API debugging

### 4. Test API Endpoints
Open `api-tests.http` and use the REST Client extension:
- Click "Send Request" above any HTTP request
- Modify the requests as needed
- View responses inline

## 🔧 Development Workflow

### Starting Development
1. **Install Dependencies**: Run task "📦 Install Dependencies"
2. **Setup Environment**: Run task "📁 Copy .env Template" and configure `.env`
3. **Start Server**: Run task "🚀 Start Dev Server" or press `Ctrl+Shift+P` → `Tasks: Run Build Task`
4. **Open Documentation**: Run task "🌐 Open API Docs"

### Testing APIs
1. **Health Check**: Run task "🏥 Test API Health"
2. **Upload Test**: Run task "📤 Test Upload Endpoint"
3. **Full Test Suite**: Run task "🧪 Run All API Tests"
4. **Manual Testing**: Use `api-tests.http` with REST Client extension

### Debugging
1. **Set Breakpoints**: Click in the gutter next to line numbers
2. **Start Debugging**: Press `F5` or select debug configuration
3. **Test Requests**: Use `debug-test.js` script or REST Client
4. **Inspect Variables**: Use Debug Console and Variables panel

### Code Quality
- **Auto-format**: Code formats automatically on save
- **Linting**: ESLint errors show in Problems panel
- **Type Checking**: TypeScript errors show inline and in Problems panel

## 📝 File Examples

### Testing Upload Endpoint
In `api-tests.http`:
```http
POST http://localhost:3000/api/upload
Content-Type: application/json

{
    "audio_url": "https://example.com/audio.mp3",
    "filename": "test.mp3"
}
```

### Debug Script Usage
Run the debug test script:
```bash
node debug-test.js
```

Or use the "🧪 Debug with Test Request" launch configuration.

## 🛠️ Customization

### Adding New Tasks
Edit `.vscode/tasks.json` to add custom tasks:
```json
{
    "label": "My Custom Task",
    "type": "shell",
    "command": "your-command",
    "group": "build"
}
```

### Custom Debug Configuration
Add to `.vscode/launch.json`:
```json
{
    "name": "My Debug Config",
    "type": "node",
    "request": "launch",
    "program": "${workspaceFolder}/your-script.js"
}
```

### Environment Variables
Update `.vscode/settings.json` for REST Client:
```json
"rest-client.environmentVariables": {
    "local": {
        "baseUrl": "http://localhost:3000",
        "authToken": "your-token"
    }
}
```

## 🔍 Troubleshooting

### Server Won't Start
1. Check if dependencies are installed: Run "📦 Install Dependencies"
2. Verify `.env` file exists and is configured
3. Check if port 3000 is available

### Debug Not Working
1. Ensure server is running
2. Check debug port isn't in use
3. Try "🔗 Attach to Next.js Server" if launch fails

### REST Client Issues
1. Install REST Client extension
2. Check server is running on correct port
3. Verify request syntax in `.http` files

### Extension Problems
1. Check recommended extensions are installed
2. Restart VS Code if extensions aren't loading
3. Update extensions to latest versions

## 🎯 Pro Tips

1. **Keyboard Shortcuts**:
   - `Ctrl+Shift+P`: Command Palette
   - `F5`: Start Debugging
   - `Ctrl+` `: Toggle Terminal
   - `Ctrl+Shift+E`: Explorer
   - `Ctrl+Shift+D`: Debug Panel

2. **Quick Testing**:
   - Use REST Client for rapid API testing
   - Set breakpoints in API routes for debugging
   - Use debug test script for automated testing

3. **Productivity**:
   - Enable auto-save for faster iteration
   - Use file nesting to reduce clutter
   - Leverage IntelliSense for faster coding

4. **Code Quality**:
   - Format on save keeps code consistent
   - ESLint catches common issues
   - TypeScript provides type safety

Happy coding! 🎵 