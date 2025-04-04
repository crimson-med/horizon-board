import * as fs from "fs";
import * as path from "path";
import { HorizonSettings } from "../settings/horizonSettings";
import { Story, StoryColumns } from "./storyService";

export class VirtualizationManager {
  private static readonly HORIZON_DIR = ".horizon";
  
  /**
   * Convert a column name to a slug for file naming
   */
  public static slugify(columnName: string): string {
    return columnName
      .toLowerCase()
      .replace(/[^\w\s-]/g, "") // Remove special characters
      .replace(/[\s_-]+/g, "-") // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
  }
  
  /**
   * Initialize the virtualization structure
   * @param settings Horizon settings
   */
  public static initializeVirtualization(settings: HorizonSettings): void {
    if (!settings.storyDirectory || !settings.columns) {
      return;
    }
    
    try {
      // Create the .horizon directory if it doesn't exist
      const workspacePath = this.getWorkspacePath();
      if (!workspacePath) {
        console.error("No workspace path found");
        return;
      }
      
      const storyDirPath = path.join(workspacePath, settings.storyDirectory);
      const horizonDirPath = path.join(storyDirPath, this.HORIZON_DIR);
      
      if (!fs.existsSync(storyDirPath)) {
        console.error(`Story directory '${settings.storyDirectory}' not found`);
        return;
      }
      
      // Check if this is the first-time initialization
      const isFirstTimeSetup = !fs.existsSync(horizonDirPath);
      
      // Create the .horizon directory if it doesn't exist
      if (isFirstTimeSetup) {
        fs.mkdirSync(horizonDirPath);
      }
      
      // Create a file for each column
      const columnNames = Array.isArray(settings.columns) 
        ? settings.columns 
        : settings.columns ? Object.keys(settings.columns) : [];
      
      // Get all markdown files in the story directory
      const allStoryFiles = this.getAllMarkdownFiles(storyDirPath);
      
      // Create or update the column files
      columnNames.forEach((column, index) => {
        const columnSlug = this.slugify(column);
        const columnFilePath = path.join(horizonDirPath, `${columnSlug}.json`);
        
        // Create the file if it doesn't exist
        if (!fs.existsSync(columnFilePath)) {
          // If this is the first column and first-time setup, add all stories to it
          if (isFirstTimeSetup && index === 0 && allStoryFiles.length > 0) {
            fs.writeFileSync(columnFilePath, JSON.stringify(allStoryFiles, null, 2));
          } else {
            fs.writeFileSync(columnFilePath, JSON.stringify([], null, 2));
          }
        }
      });
    } catch (error) {
      console.error("Error initializing virtualization:", error);
    }
  }
  
  /**
   * Get stories from each column file
   */
  public static getVirtualizedStories(settings: HorizonSettings): StoryColumns {
    const result: StoryColumns = {};
    
    if (!settings.storyDirectory || !settings.useVirtualization) {
      return result;
    }
    
    try {
      const workspacePath = this.getWorkspacePath();
      if (!workspacePath) {
        return result;
      }
      
      const storyDirPath = path.join(workspacePath, settings.storyDirectory);
      const horizonDirPath = path.join(storyDirPath, this.HORIZON_DIR);
      
      // Return empty if virtualization structure doesn't exist
      if (!fs.existsSync(horizonDirPath)) {
        this.initializeVirtualization(settings);
        return result;
      }
      
      // Get column names
      const columnNames = Array.isArray(settings.columns) 
        ? settings.columns 
        : settings.columns ? Object.keys(settings.columns) : [];
      
      // Get all markdown files in the story directory (flat structure)
      const allStories = this.getAllMarkdownFiles(storyDirPath);
      
      // Read each column file and get the stories
      columnNames.forEach(column => {
        const columnSlug = this.slugify(column);
        const columnFilePath = path.join(horizonDirPath, `${columnSlug}.json`);
        
        if (fs.existsSync(columnFilePath)) {
          try {
            // Read the column file
            const fileContent = fs.readFileSync(columnFilePath, "utf8");
            const storyFiles: string[] = JSON.parse(fileContent);
            
            // Find the full stories
            const stories: Story[] = storyFiles
              .map(filename => {
                const fullPath = path.join(storyDirPath, filename);
                if (fs.existsSync(fullPath)) {
                  return {
                    name: path.basename(filename, ".md"),
                    path: fullPath
                  };
                }
                return null;
              })
              .filter((story): story is Story => story !== null);
            
            result[column] = stories;
          } catch (error) {
            console.error(`Error reading ${column} file:`, error);
            result[column] = [];
          }
        } else {
          // Create the file if it doesn't exist
          fs.writeFileSync(columnFilePath, JSON.stringify([], null, 2));
          result[column] = [];
        }
      });
      
      return result;
    } catch (error) {
      console.error("Error getting virtualized stories:", error);
      return result;
    }
  }
  
  /**
   * Move a story from one column to another in the virtualized structure
   */
  public static moveVirtualizedStory(
    storyPath: string, 
    sourceColumn: string, 
    targetColumn: string,
    settings: HorizonSettings
  ): { success: boolean; message?: string } {
    if (!settings.storyDirectory || !settings.useVirtualization) {
      return { success: false, message: "Virtualization is not enabled" };
    }
    
    try {
      const workspacePath = this.getWorkspacePath();
      if (!workspacePath) {
        return { success: false, message: "No workspace path found" };
      }
      
      const storyDirPath = path.join(workspacePath, settings.storyDirectory);
      const horizonDirPath = path.join(storyDirPath, this.HORIZON_DIR);
      
      // Check if virtualization structure exists
      if (!fs.existsSync(horizonDirPath)) {
        this.initializeVirtualization(settings);
      }
      
      // Get the story filename
      const storyFilename = path.basename(storyPath);
      
      // Get the source and target column files
      const sourceSlug = this.slugify(sourceColumn);
      const targetSlug = this.slugify(targetColumn);
      
      const sourceFilePath = path.join(horizonDirPath, `${sourceSlug}.json`);
      const targetFilePath = path.join(horizonDirPath, `${targetSlug}.json`);
      
      // Ensure both files exist
      if (!fs.existsSync(sourceFilePath)) {
        fs.writeFileSync(sourceFilePath, JSON.stringify([], null, 2));
      }
      
      if (!fs.existsSync(targetFilePath)) {
        fs.writeFileSync(targetFilePath, JSON.stringify([], null, 2));
      }
      
      // Read the source and target files
      const sourceContent = fs.readFileSync(sourceFilePath, "utf8");
      const targetContent = fs.readFileSync(targetFilePath, "utf8");
      
      const sourceStories: string[] = JSON.parse(sourceContent);
      const targetStories: string[] = JSON.parse(targetContent);
      
      // Remove the story from the source column
      const updatedSourceStories = sourceStories.filter(file => file !== storyFilename);
      
      // Add the story to the target column if it's not already there
      if (!targetStories.includes(storyFilename)) {
        targetStories.push(storyFilename);
      }
      
      // Write the updated files
      fs.writeFileSync(sourceFilePath, JSON.stringify(updatedSourceStories, null, 2));
      fs.writeFileSync(targetFilePath, JSON.stringify(targetStories, null, 2));
      
      return { success: true };
    } catch (error) {
      console.error("Error moving virtualized story:", error);
      return { success: false, message: `Error moving story: ${error}` };
    }
  }
  
  /**
   * Get all markdown files in a directory (flat, non-recursive)
   */
  private static getAllMarkdownFiles(directoryPath: string): string[] {
    try {
      return fs.readdirSync(directoryPath)
        .filter(file => {
          const filePath = path.join(directoryPath, file);
          return fs.statSync(filePath).isFile() && file.endsWith(".md");
        });
    } catch (error) {
      console.error("Error getting markdown files:", error);
      return [];
    }
  }
  
  /**
   * Get the workspace path
   */
  private static getWorkspacePath(): string | undefined {
    const vscode = require('vscode');
    const workspaceFolders = vscode.workspace.workspaceFolders;
    
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return undefined;
    }
    
    return workspaceFolders[0].uri.fsPath;
  }
}
