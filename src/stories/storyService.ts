import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { HorizonSettings } from "../settings/horizonSettings";
import { VirtualizationManager } from "./virtualizationManager";

export interface Story {
  name: string;
  path: string;
}

export interface StoryColumns {
  [folder: string]: Story[];
}

export class StoryService {
  public static getStoriesFromDirectory(
    settings: HorizonSettings
  ): StoryColumns {
    // Use virtualization if enabled
    if (settings.useVirtualization) {
      return VirtualizationManager.getVirtualizedStories(settings);
    }
    
    // Otherwise use physical directory structure
    const result: StoryColumns = {};

    if (!settings.storyDirectory) {
      return result;
    }

    try {
      // Get workspace folders
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders) {
        return result;
      }

      const rootPath = workspaceFolders[0].uri.fsPath;
      const storyDirPath = path.join(rootPath, settings.storyDirectory);

      if (!fs.existsSync(storyDirPath)) {
        vscode.window.showWarningMessage(
          `Story directory '${settings.storyDirectory}' not found.`
        );
        return result;
      }

      // Read all subfolders as columns
      const items = fs.readdirSync(storyDirPath, { withFileTypes: true });

      // Process only directories
      for (const item of items) {
        if (item.isDirectory()) {
          const folderPath = path.join(storyDirPath, item.name);
          const stories = fs
            .readdirSync(folderPath)
            .filter((file) => file.endsWith(".md")) // Only include markdown files
            .map((file) => ({
              name: path.basename(file, ".md"), // Remove .md extension
              path: path.join(folderPath, file), // Full path to the file
            }));

          result[item.name] = stories;
        }
      }

      return result;
    } catch (error) {
      console.error("Error reading story directory:", error);
      vscode.window.showErrorMessage(`Error reading story directory: ${error}`);
      return result;
    }
  }

  public static openStory(storyPath: string): void {
    try {
      const filePath = vscode.Uri.file(storyPath);
      vscode.commands.executeCommand("vscode.open", filePath);
    } catch (error) {
      console.error("Error opening story file:", error);
      vscode.window.showErrorMessage(`Error opening story file: ${error}`);
    }
  }
  
  /**
   * Move a story between columns, considering virtualization if enabled
   */
  public static moveStory(
    storyPath: string,
    sourceColumn: string,
    targetColumn: string,
    settings: HorizonSettings
  ): { success: boolean; newPath?: string; message?: string } {
    // Use virtualization if enabled
    if (settings.useVirtualization) {
      const result = VirtualizationManager.moveVirtualizedStory(
        storyPath,
        sourceColumn,
        targetColumn,
        settings
      );
      
      return {
        success: result.success,
        newPath: storyPath, // Path remains the same in virtualization
        message: result.message
      };
    }
    
    // Otherwise use physical file move
    return this.moveStoryFile(storyPath, sourceColumn, targetColumn, settings);
  }
  
  /**
   * Move a story file from one column to another physically
   */
  private static moveStoryFile(
    storyPath: string,
    sourceColumn: string,
    targetColumn: string,
    settings: HorizonSettings
  ): { success: boolean; newPath?: string; message?: string } {
    try {
      if (!settings.storyDirectory) {
        return {
          success: false,
          message: "No story directory configured in settings",
        };
      }

      // Get workspace folders
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders) {
        return {
          success: false,
          message: "No workspace folder open",
        };
      }

      const rootPath = workspaceFolders[0].uri.fsPath;
      const storyDirPath = path.join(rootPath, settings.storyDirectory);

      // Verify source and target directories exist
      const sourceDir = path.join(storyDirPath, sourceColumn);
      const targetDir = path.join(storyDirPath, targetColumn);

      if (!fs.existsSync(sourceDir)) {
        return {
          success: false,
          message: `Source directory '${sourceColumn}' not found`,
        };
      }

      if (!fs.existsSync(targetDir)) {
        return {
          success: false,
          message: `Target directory '${targetColumn}' not found`,
        };
      }

      // Get the filename
      const fileName = path.basename(storyPath);
      const newPath = path.join(targetDir, fileName);

      // Check if target file already exists
      if (fs.existsSync(newPath)) {
        return {
          success: false,
          message: `A story with this name already exists in the ${targetColumn} column`,
        };
      }

      // Move the file
      fs.renameSync(storyPath, newPath);

      return {
        success: true,
        newPath: newPath,
      };
    } catch (error) {
      console.error("Error moving story file:", error);
      return {
        success: false,
        message: `Error moving story file: ${error}`,
      };
    }
  }
}
