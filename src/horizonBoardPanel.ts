import * as vscode from "vscode";
import { SettingsManager } from "./settings/horizonSettings";
import { StoryService } from "./stories/storyService";
import { StoryFileManager } from "./stories/storyFileManager";
import { HorizonViewGenerator } from "./view/horizonViewGenerator";
import { VirtualizationManager } from "./stories/virtualizationManager";

export class HorizonBoardPanel {
  /**
   * Track the currently panel. Only allow a single panel to exist at a time.
   */
  public static currentPanel: HorizonBoardPanel | undefined;

  private static readonly viewType = "horizonBoard";

  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];

  public static createOrShow(extensionUri: vscode.Uri) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // If we already have a panel, show it.
    if (HorizonBoardPanel.currentPanel) {
      HorizonBoardPanel.currentPanel._panel.reveal(column);
      return;
    }

    // Otherwise, create a new panel.
    const panel = vscode.window.createWebviewPanel(
      HorizonBoardPanel.viewType,
      "Horizon Board",
      column || vscode.ViewColumn.One,
      {
        // Enable JavaScript in the webview
        enableScripts: true,

        // Restrict the webview to only load resources from the extension's directory
        localResourceRoots: [extensionUri],
      }
    );

    HorizonBoardPanel.currentPanel = new HorizonBoardPanel(panel, extensionUri);
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._extensionUri = extensionUri;

    // Set the webview's initial html content
    this._update();

    // Listen for when the panel is disposed
    // This happens when the user closes the panel or when the panel is closed programmatically
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Update the content based on view changes
    this._panel.onDidChangeViewState(
      (e) => {
        if (this._panel.visible) {
          this._update();
        }
      },
      null,
      this._disposables
    );

    // Handle messages from the webview
    this._panel.webview.onDidReceiveMessage(
      (message) => {
        switch (message.command) {
          case "refresh":
            this.refresh();
            return;
          case "openStory":
            StoryService.openStory(message.storyPath);
            return;
          case "openSettings":
            SettingsManager.openSettingsFile();
            return;
          case "moveStory":
            this._handleMoveStory(
              message.storyPath,
              message.sourceColumn,
              message.targetColumn
            );
            return;
        }
      },
      null,
      this._disposables
    );
  }

  public refresh() {
    this._update();
  }

  public dispose() {
    HorizonBoardPanel.currentPanel = undefined;

    // Clean up our resources
    this._panel.dispose();

    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }

  private _update() {
    const settings = SettingsManager.getSettings();
    
    // Initialize virtualization if enabled
    if (settings.useVirtualization) {
      VirtualizationManager.initializeVirtualization(settings);
    }
    
    const stories = StoryService.getStoriesFromDirectory(settings);
    this._panel.webview.html = HorizonViewGenerator.generateWebviewContent(
      this._extensionUri,
      settings,
      stories
    );

    // Update the panel title if board name is provided
    if (settings.name) {
      this._panel.title = settings.name;
    } else {
      this._panel.title = "Horizon Board";
    }
  }

  private _handleMoveStory(
    storyPath: string,
    sourceColumn: string,
    targetColumn: string
  ) {
    // Get settings
    const settings = SettingsManager.getSettings();
    
    // Move the story using the StoryFileManager
    // This will use virtualization if enabled in settings
    const result = StoryFileManager.moveStory(
      storyPath,
      sourceColumn,
      targetColumn,
      settings
    );

    // Send response back to webview
    this._panel.webview.postMessage({
      command: "moveStoryResult",
      success: result.success,
      message: result.message,
      storyPath: storyPath,
      newPath: result.newPath,
      sourceColumn: sourceColumn,
      targetColumn: targetColumn
    });

    // If successful, refresh the view
    if (result.success) {
      this.refresh();
    }
  }
}
