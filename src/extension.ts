import * as vscode from "vscode";
import { HorizonBoardPanel } from "./horizonBoardPanel";

export function activate(context: vscode.ExtensionContext) {
  console.log("Horizon Board extension is now active");

  // Register command to open the Horizon board
  context.subscriptions.push(
    vscode.commands.registerCommand("horizonBoard.openBoard", () => {
      HorizonBoardPanel.createOrShow(context.extensionUri);
    })
  );

  // Register the refresh command
  context.subscriptions.push(
    vscode.commands.registerCommand("horizonBoard.refresh", () => {
      HorizonBoardPanel.currentPanel?.refresh();
    })
  );

  // Auto-open the Horizon board when the extension is activated
  // This ensures it opens as a tab alongside the welcome tab
  setTimeout(() => {
    vscode.commands.executeCommand("horizonBoard.openBoard");
  }, 500);
}

export function deactivate() {}
