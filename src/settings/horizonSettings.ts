import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { ColorConfig, ThemeName, getTheme, DEFAULT_THEME } from "./themes";

export interface ColumnConfig {
  label?: string;
  color?: string;
}

// ColorConfig and ThemeName are now imported from './themes'

export interface HorizonSettings {
  name?: string;
  storyDirectory?: string;
  theme?: ThemeName;
  colors?: ColorConfig;
  columns?:
    | {
        [key: string]: ColumnConfig | undefined;
      }
    | string[];
  useVirtualization?: boolean;
}

export class SettingsManager {
  public static getSettingsFilePath(): string | undefined {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      return undefined;
    }

    const rootPath = workspaceFolders[0].uri.fsPath;
    return path.join(rootPath, "horizon.json");
  }

  /**
   * Get theme colors by theme name
   */
  public static getThemeColors(themeName: ThemeName): ColorConfig {
    // Use the modular theme system to get the theme
    return getTheme(themeName);
  }

  public static getSettings(): HorizonSettings {
    // Default settings if no file is found
    const defaultSettings: HorizonSettings = {
      name: "Horizon Board",
      storyDirectory: "",
      theme: DEFAULT_THEME,
      columns: ["To Do", "Doing", "Done"],
      useVirtualization: true,
    };

    try {
      const settingsPath = this.getSettingsFilePath();
      if (!settingsPath || !fs.existsSync(settingsPath)) {
        vscode.window.showInformationMessage(
          "No horizon.json file found. Using default settings."
        );
        return defaultSettings;
      }

      // Read and parse the settings file
      const settingsContent = fs.readFileSync(settingsPath, "utf8");
      const settings = JSON.parse(settingsContent) as HorizonSettings;

      // Validate settings
      if (
        !settings.columns ||
        !(
          Array.isArray(settings.columns) ||
          typeof settings.columns === "object"
        ) ||
        (Array.isArray(settings.columns) && settings.columns.length === 0)
      ) {
        vscode.window.showWarningMessage(
          "Invalid columns in horizon.json. Using default columns."
        );
        return defaultSettings;
      }

      // Get theme colors
      const themeName = settings.theme || DEFAULT_THEME;
      const themeColors = this.getThemeColors(themeName);

      // Apply custom colors over theme colors if provided
      const colors: ColorConfig = {
        ...themeColors,
        ...(settings.colors || {}),
      };

      // Normalize and fill in default values
      return {
        name: settings.name || defaultSettings.name,
        storyDirectory:
          settings.storyDirectory || defaultSettings.storyDirectory,
        theme: themeName,
        colors,
        columns: settings.columns || defaultSettings.columns,
        useVirtualization:
          typeof settings.useVirtualization === "boolean"
            ? settings.useVirtualization
            : defaultSettings.useVirtualization,
      };
    } catch (error) {
      console.error("Error reading horizon.json:", error);
      vscode.window.showErrorMessage(
        "Error reading horizon.json file. Using default settings."
      );
      return defaultSettings;
    }
  }

  public static openSettingsFile(): void {
    try {
      const settingsPath = this.getSettingsFilePath();
      if (!settingsPath) {
        vscode.window.showErrorMessage("No workspace folder open.");
        return;
      }

      const filePath = vscode.Uri.file(settingsPath);
      vscode.commands.executeCommand("vscode.open", filePath);
    } catch (error) {
      console.error("Error opening settings file:", error);
      vscode.window.showErrorMessage(`Error opening settings file: ${error}`);
    }
  }
}
