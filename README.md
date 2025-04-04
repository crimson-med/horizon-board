# Horizon Board Extension for VS Code

A story management board extension for Visual Studio Code that reads configurations from a `horizon.json` file at the root of your project and displays stories from your project folders in a board layout.

## Features

- Dedicated button in the activity bar for quick access
- Opens as a full tab in the editor area
- Customizable board name and column names
- Reads stories directly from your project's folder structure
- Visual board interface that displays your stories organized by status
- Drag-and-drop functionality for moving stories between columns
- Seven built-in themes for customizing your board's appearance
- Virtual or physical file organization modes

## Requirements

- Visual Studio Code version 1.74.0 or higher

## How to Use

1. Create a `horizon.json` file at the root of your project with the following format:

```json
{
  "name": "Project Horizon",
  "storyDirectory": "stories",
  "theme": "dracula",
  "useVirtualization": true,
  "columns": {
    "Backlog": {
      "label": "To Refine"
    },
    "To Do": {},
    "Doing": {},
    "Done": {}
  }
}
```

2. Create a folder structure for your stories that matches your column names:

```
stories/
├── Backlog/
│   ├── 004.docker-container-setup.md
│   └── 005.terraform-script.md
├── To Do/
│   ├── 002.user-sso-discord.md
│   └── 003.user-sso-google.md
├── Doing/
│   └── 001.user-auth.md
└── Done/
```

3. Click on the Horizon Board icon in the activity bar to view your board.

## Example

If you are unsure on how to use it follow this example:

https://github.com/crimson-med/horizon-example

## Configuration Options

The `horizon.json` file supports the following options:

- `name`: (optional) The name of your board displayed at the top of the board
- `storyDirectory`: The relative path to the directory containing your story folders
- `theme`: (optional) The theme to use for the board (default: "dracula")
- `useVirtualization`: (optional) Whether to use virtualization for story organization (default: true)
- `colors`: (optional) Custom color overrides for specific elements
- `columns`: An object mapping folder names to column configurations
  - Each key is a folder name that should exist in your story directory
  - Each value can have a `label` property to customize the display name for that column
  - Each value can have a `color` property to customize the column's header color

### Themes

Horizon Board comes with seven beautiful built-in themes:

- `light`: Clean, bright theme with high readability
- `dark`: Classic dark mode with good contrast
- `sunset`: Warm gradient-inspired colors
- `halloween`: Dark theme with spooky accent colors
- `dracula`: Elegant dark theme with purple accents (default)
- `synthwave`: Retro-futuristic neon colors on dark background
- `sakura`: Soft pink cherry blossom-inspired theme

You can set a theme in your `horizon.json` file:

```json
{
  "theme": "synthwave"
}
```

### Custom Color Overrides

You can override specific colors of any theme by adding a `colors` object to your `horizon.json`:

```json
{
  "theme": "dark",
  "colors": {
    "header": "#ff5252", // Header background color
    "headerText": "#ffffff", // Header text color
    "column": "#303030", // Column header background color
    "columnText": "#ffffff", // Column header text color
    "storyId": "#64b5f6", // Story ID color
    "storyText": "#ffffff", // Story text color
    "cardBg": "#2d2d2d", // Card/story background color
    "cardBgHover": "#3e3e3e", // Card/story background color on hover
    "columnBg": "#1e1e1e", // Column background color
    "pageBg": "#1e1e1e" // Page/board background color
  }
}
```

The custom colors will be applied on top of the selected theme, so you only need to specify the colors you want to change.

### Virtualization Mode

Horizon Board supports two modes for organizing your stories:

- **Physical mode** (`useVirtualization: false`): Stories are organized in physical folders matching column names
- **Virtual mode** (`useVirtualization: true`): Stories are kept in a flat directory structure with metadata tracking their column assignment

Virtual mode is enabled by default and allows for easier file management.

All configuration is done via the `horizon.json` file at the root of your workspace.

## Development

### Setup

```bash
# Clone the repository
git clone <your-repo-url>

# Install dependencies
npm install

# Compile the extension
npm run compile
```

### Debugging

Press F5 in VS Code to open a new window with your extension loaded. You can inspect the webview using the VS Code Developer Tools.

### Packaging and Publishing

#### Building a VSIX Package

```bash
# Install vsce if you don't have it
npm install -g @vscode/vsce

# Package the extension
vsce package
```

This will create a `.vsix` file in your project root that can be distributed and installed manually.

#### Installing from VSIX

To install the packaged extension:

1. Open VS Code
2. Go to Extensions view (Ctrl+Shift+X)
3. Click on the ... (More Actions) button at the top
4. Select "Install from VSIX..."
5. Choose your .vsix file

#### Publishing to VS Code Marketplace

1. Create a publisher account on https://marketplace.visualstudio.com/
2. Get a Personal Access Token (PAT) from Azure DevOps
3. Login to vsce:

```bash
vsce login <publisher-name>
```

4. Publish your extension:

```bash
vsce publish
```

For more detailed instructions, see the [official publishing guide](https://code.visualstudio.com/api/working-with-extensions/publishing-extension).

## Features

### Story Management

- Click on a story card to open the markdown file in the editor
- Click on the board name to open the `horizon.json` configuration file
- Drag and drop stories between columns to move them

### Search Functionality

- Use the search bar below the board header to filter stories
- Search works across all columns simultaneously
- Filters by both story ID and content
- Clear the search with one click to restore the full view

### Theme Customization

- Choose from seven beautiful built-in themes
- Customize individual color elements
- Use column-specific colors to visually distinguish different stages of your workflow

### File Organization

- Support for both virtualized and physical file structures
- Easily manage stories with drag-and-drop interface
- Use column-specific colors to visually distinguish different stages of your workflow

## Author

- [Burlet Mederic](https://github.com/crimson-med)
