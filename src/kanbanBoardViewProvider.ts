import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

interface KanbanSettings {
  columns: string[];
}

export class KanbanBoardViewProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    this._updateWebview();
  }

  public refresh() {
    if (this._view) {
      this._updateWebview();
    }
  }

  private _updateWebview() {
    if (!this._view) {
      return;
    }

    const settings = this._getKanbanSettings();
    this._view.webview.html = this._getWebviewContent(settings);
  }

  private _getKanbanSettings(): KanbanSettings {
    // Default settings if no file is found
    const defaultSettings: KanbanSettings = {
      columns: ["To Do", "Doing", "Done"],
    };

    try {
      // Get workspace folders
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders) {
        vscode.window.showWarningMessage(
          "No workspace folder open. Using default columns."
        );
        return defaultSettings;
      }

      // Look for settings.cri in the root of the workspace
      const rootPath = workspaceFolders[0].uri.fsPath;
      const settingsPath = path.join(rootPath, "settings.cri");

      if (!fs.existsSync(settingsPath)) {
        vscode.window.showInformationMessage(
          "No settings.cri file found. Using default columns."
        );
        return defaultSettings;
      }

      // Read and parse the settings file
      const settingsContent = fs.readFileSync(settingsPath, "utf8");
      const settings = JSON.parse(settingsContent) as KanbanSettings;

      if (
        !settings.columns ||
        !Array.isArray(settings.columns) ||
        settings.columns.length === 0
      ) {
        vscode.window.showWarningMessage(
          "Invalid columns in settings.cri. Using default columns."
        );
        return defaultSettings;
      }

      return settings;
    } catch (error) {
      console.error("Error reading settings.cri:", error);
      vscode.window.showErrorMessage(
        "Error reading settings.cri file. Using default columns."
      );
      return defaultSettings;
    }
  }

  private _getWebviewContent(settings: KanbanSettings): string {
    const columns = settings.columns;

    // Generate column HTML based on settings
    const columnsHtml = columns
      .map(
        (column) => `
      <div class="kanban-column">
        <h2>${column}</h2>
        <div class="kanban-items" data-column="${column}">
          <!-- Items will be added here dynamically -->
        </div>
      </div>
    `
      )
      .join("");

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Kanban Board</title>
      <style>
        body {
          font-family: var(--vscode-font-family);
          background-color: var(--vscode-editor-background);
          color: var(--vscode-foreground);
          padding: 0;
          margin: 0;
        }
        .kanban-board {
          display: flex;
          flex-direction: row;
          height: 100vh;
          padding: 10px;
          box-sizing: border-box;
          overflow-x: auto;
        }
        .kanban-column {
          flex: 1;
          min-width: 250px;
          margin: 0 10px;
          background-color: var(--vscode-sideBar-background);
          border-radius: 5px;
          display: flex;
          flex-direction: column;
          max-height: 100%;
        }
        .kanban-column h2 {
          padding: 10px;
          margin: 0;
          text-align: center;
          background-color: var(--vscode-activityBar-background);
          border-top-left-radius: 5px;
          border-top-right-radius: 5px;
          font-size: 16px;
        }
        .kanban-items {
          padding: 10px;
          overflow-y: auto;
          flex-grow: 1;
        }
        .kanban-item {
          background-color: var(--vscode-editorWidget-background);
          border-radius: 3px;
          padding: 10px;
          margin-bottom: 8px;
          cursor: pointer;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        }
        .kanban-item:hover {
          background-color: var(--vscode-list-hoverBackground);
        }
      </style>
    </head>
    <body>
      <div class="kanban-board">
        ${columnsHtml}
      </div>
      
      <script>
        (function() {
          // We could add drag-and-drop functionality here in a more complete implementation
          // For demonstration purposes, we're just showing the columns with sample items
          
          const vscode = acquireVsCodeApi();
          
          // Function to add a sample item to each column
          function addSampleItems() {
            const columns = document.querySelectorAll('.kanban-items');
            columns.forEach((column, index) => {
              const columnName = column.getAttribute('data-column');
              const item = document.createElement('div');
              item.className = 'kanban-item';
              item.textContent = 'Sample item for ' + columnName;
              column.appendChild(item);
            });
          }
          
          // Add sample items for demonstration
          addSampleItems();
        })();
      </script>
    </body>
    </html>`;
  }
}
