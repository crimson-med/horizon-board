import * as vscode from "vscode";

export class KanbanBoardViewProvider implements vscode.WebviewViewProvider {
  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    webviewView.webview.html = "<html><body>Simple test</body></html>";
  }

  public refresh() {
    // Placeholder
  }
}
