import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { HorizonSettings } from "../settings/horizonSettings";
import { StoryService } from "./storyService";

export class StoryFileManager {
  /**
   * Move a story between columns, supporting both physical and virtualized modes
   * @param storyPath The current path of the story file
   * @param sourceColumn The source column name
   * @param targetColumn The target column name
   * @param settings The horizon settings
   * @returns Success status and new path if successful
   */
  public static moveStory(
    storyPath: string,
    sourceColumn: string,
    targetColumn: string,
    settings: HorizonSettings
  ): { success: boolean; newPath?: string; message?: string } {
    // Use the StoryService to handle the move, which supports both physical and virtualized story management
    return StoryService.moveStory(storyPath, sourceColumn, targetColumn, settings);
  }
  
  /**
   * Move a story file from one column to another
   * @param storyPath The current path of the story file
   * @param sourceColumn The source column name
   * @param targetColumn The target column name
   * @param settings The horizon settings
   * @returns Success status and new path if successful
   * @deprecated Use moveStory instead which supports virtualization
   */
  public static moveStoryFile(
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
