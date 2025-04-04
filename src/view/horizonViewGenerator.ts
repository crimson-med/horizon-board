import * as vscode from "vscode";
import { HorizonSettings, ColumnConfig } from "../settings/horizonSettings";
import { StoryColumns, Story } from "../stories/storyService";
import { CssLoader } from "./cssLoader";
import { SearchUtility } from "./search/searchUtility";

export class HorizonViewGenerator {
  public static generateWebviewContent(
    extensionUri: vscode.Uri,
    settings: HorizonSettings,
    stories: StoryColumns
  ): string {
    let columns: string[] = [];
    let columnLabels: { [key: string]: string } = {};

    // Process columns based on the type
    if (Array.isArray(settings.columns)) {
      columns = settings.columns as string[];
      // Use the same names for labels
      columns.forEach((col) => {
        columnLabels[col] = col;
      });
    } else if (settings.columns && typeof settings.columns === "object") {
      // Object format with potential custom labels
      const columnsObj = settings.columns as {
        [key: string]: ColumnConfig | undefined;
      };
      columns = Object.keys(columnsObj);
      columns.forEach((col) => {
        const colConfig = columnsObj[col];
        columnLabels[col] = colConfig?.label || col;
      });
    }

    // Get global color settings
    const colorSettings = settings.colors || {};

    // Generate column HTML
    const columnsHtml = this.generateColumnsHtml(
      columns,
      columnLabels,
      stories,
      settings
    );
    const boardName = settings.name || "Horizon Board";
    const headerColor = colorSettings.header || "#333333";

    // Prepare color variables for CSS
    const colorVariables: { [key: string]: string } = {
      "header": colorSettings.header || "#333333",
      "headerText": colorSettings.headerText || "#ffffff",
      "column": colorSettings.column || "#252526",
      "columnText": colorSettings.columnText || "#ffffff",
      "storyId": colorSettings.storyId || "#007acc",
      "storyText": colorSettings.storyText || "#cccccc",
      "cardBg": colorSettings.cardBg || "#2d2d2d",
      "cardBgHover": colorSettings.cardBgHover || "#3e3e3e",
      "columnBg": colorSettings.columnBg || "#1e1e1e",
      "pageBg": colorSettings.pageBg || "#1e1e1e",
    };

    return this.generateFullHtml(
      extensionUri,
      boardName,
      columnsHtml,
      colorVariables
    );
  }

  private static generateColumnsHtml(
    columns: string[],
    columnLabels: { [key: string]: string },
    stories: StoryColumns,
    settings: HorizonSettings
  ): string {
    // Get global color settings
    const colorSettings = settings.colors || {};

    return columns
      .map((column) => {
        const colConfig = Array.isArray(settings.columns)
          ? {}
          : (settings.columns as { [key: string]: ColumnConfig | undefined })[
              column
            ] || {};
        const label = columnLabels[column];

        // Get column-specific color or fall back to default
        const columnColor =
          colConfig.color || colorSettings.column || "#252526";

        // Get stories for this column
        const columnStories = stories[column] || [];
        const storiesHtml = this.generateStoriesHtml(
          columnStories,
          colorSettings
        );

        return `
      <div class="horizon-column">
        <h2 style="background-color: ${columnColor}; color: ${colorSettings.columnText || '#ffffff'}">${label}</h2>
        <div class="horizon-items" 
          data-column="${column}"
          data-droppable="true">
          ${storiesHtml}
          ${
            columnStories.length === 0
              ? '<div class="empty-message">No stories</div>'
              : ""
          }
        </div>
      </div>
    `;
      })
      .join("");
  }

  private static generateStoriesHtml(
    columnStories: Story[],
    colorSettings: any
  ): string {
    return columnStories
      .map((story) => {
        const storyId = story.name.split(".")[0];
        const storyTitle = story.name.split(".").slice(1).join(".");

        return `
      <div class="story-item" 
        draggable="true"
        data-path="${story.path}"
        data-id="${storyId}"
        data-title="${storyTitle}">
        <div class="story-id">${storyId}</div>
        <div class="story-title">${storyTitle}</div>
      </div>
    `;
      })
      .join("");
  }

  private static generateFullHtml(
    extensionUri: vscode.Uri,
    boardName: string,
    columnsHtml: string,
    colorVariables: { [key: string]: string }
  ): string {
    // Load CSS from external files and inject color variables
    const mainCssContent = CssLoader.getStylesheetWithColorVariables(
      extensionUri,
      "src/view/horizonBoard.css",
      colorVariables
    );
    
    // Load search CSS separately
    const searchCssContent = CssLoader.getStylesheetWithColorVariables(
      extensionUri,
      "src/view/search/search.css",
      colorVariables
    );
    
    // Combine CSS content
    const cssContent = mainCssContent + searchCssContent;

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${boardName}</title>
      <style>
        ${cssContent}
        
        /* Custom overrides for dynamic colors */
        /* All dynamic colors are now handled in the main CSS */
      </style>
    </head>
    <body>
      <div class="board-header">
        <h1>${boardName}</h1>
      </div>
      ${SearchUtility.generateSearchBarHtml()}
      <div class="horizon-board">
        ${columnsHtml}
      </div>
      
      <script>
        (function() {
          const vscode = acquireVsCodeApi();
          let draggedItem = null;
          let sourceColumn = null;
          
          // Handle keyboard shortcut to refresh
          document.querySelector('body').addEventListener('keydown', event => {
            if (event.key === 'r' && (event.ctrlKey || event.metaKey)) {
              vscode.postMessage({
                command: 'refresh'
              });
            }
          });
          
          // Initialize drag and drop for story items
          function initDragAndDrop() {
            // Add click handler for all story items
            document.querySelectorAll('.story-item').forEach(item => {
              // Click to open story
              item.addEventListener('click', () => {
                const storyPath = item.getAttribute('data-path');
                vscode.postMessage({
                  command: 'openStory',
                  storyPath: storyPath
                });
              });
              
              // Drag start
              item.addEventListener('dragstart', (e) => {
                draggedItem = item;
                sourceColumn = item.closest('.horizon-items').getAttribute('data-column');
                setTimeout(() => {
                  item.classList.add('dragging');
                }, 0);
                e.dataTransfer.setData('text/plain', item.getAttribute('data-path'));
                e.dataTransfer.effectAllowed = 'move';
              });
              
              // Drag end
              item.addEventListener('dragend', () => {
                item.classList.remove('dragging');
                draggedItem = null;
                sourceColumn = null;
              });
            });
            
            // Make columns droppable
            document.querySelectorAll('[data-droppable="true"]').forEach(dropZone => {
              // Drag over
              dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                dropZone.classList.add('drag-over');
              });
              
              // Drag leave
              dropZone.addEventListener('dragleave', () => {
                dropZone.classList.remove('drag-over');
              });
              
              // Drop
              dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.classList.remove('drag-over');
                
                if (!draggedItem) return;
                
                const targetColumn = dropZone.getAttribute('data-column');
                
                // Don't do anything if dropping in the same column
                if (sourceColumn === targetColumn) return;
                
                const storyPath = draggedItem.getAttribute('data-path');
                
                // Send message to extension to move the file
                vscode.postMessage({
                  command: 'moveStory',
                  storyPath: storyPath,
                  sourceColumn: sourceColumn,
                  targetColumn: targetColumn
                });
              });
            });
          }
          
          // Handle move story results from extension
          window.addEventListener('message', (event) => {
            const message = event.data;
            if (message.command === 'moveStoryResult') {
              if (!message.success) {
                // Show error message
                showNotification(message.message || 'Error moving story', 'error');
              }
            }
          });
          
          // Show notification
          function showNotification(message, type = 'info') {
            const notification = document.createElement('div');
            notification.className = 'notification ' + type;
            notification.textContent = message;
            
            document.body.appendChild(notification);
            
            // Remove after 3 seconds
            setTimeout(() => {
              notification.classList.add('fade-out');
              setTimeout(() => {
                document.body.removeChild(notification);
              }, 300);
            }, 3000);
          }
          
          // Add click handler for the board header
          document.querySelector('.board-header').addEventListener('click', () => {
            vscode.postMessage({
              command: 'openSettings'
            });
          });
          
          // Initialize drag and drop
          initDragAndDrop();
          
          // Initialize search functionality
          ${SearchUtility.generateSearchScript()}
        })();
      </script>
    </body>
    </html>`;
  }
}
