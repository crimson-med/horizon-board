import * as vscode from "vscode";
import * as fs from "fs";

export class CssLoader {
  /**
   * Get CSS content from a file
   * @param extensionContext The extension context
   * @param cssFileName The CSS file name
   * @returns The CSS content as a string
   */
  public static getStylesheetContent(
    extensionUri: vscode.Uri,
    cssFilePath: string
  ): string {
    try {
      const cssPath = vscode.Uri.joinPath(extensionUri, cssFilePath);
      return fs.readFileSync(cssPath.fsPath, "utf8");
    } catch (error) {
      console.error(`Error loading CSS file: ${error}`);
      return "";
    }
  }

  /**
   * Get CSS with dynamic color variables injected
   * @param extensionContext The extension context
   * @param cssFileName The CSS file name
   * @param colorVariables Object with color variables to inject
   * @returns The CSS content with variables injected
   */
  public static getStylesheetWithColorVariables(
    extensionUri: vscode.Uri,
    cssFilePath: string,
    colorVariables: { [key: string]: string }
  ): string {
    let cssContent = this.getStylesheetContent(extensionUri, cssFilePath);

    // Add dynamic color variables
    let dynamicVariables = "";
    for (const [key, value] of Object.entries(colorVariables)) {
      dynamicVariables += `  --horizon-${key}: ${value};\n`;
    }

    // Insert variables at the beginning of the CSS
    if (dynamicVariables) {
      cssContent = `:root {\n${dynamicVariables}}\n${cssContent}`;

      // Replace references to color variables in the CSS
      for (const key of Object.keys(colorVariables)) {
        cssContent = cssContent.replace(
          new RegExp(`var\\(--horizon-${key}\\)`, "g"),
          `var(--horizon-${key})`
        );
      }
    }

    return cssContent;
  }
}
