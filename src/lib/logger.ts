import { promises as fs } from "fs";
import path from "path";

const LOG_DIR = path.join(process.cwd(), "logs");
const LOG_FILE = path.join(
  LOG_DIR,
  `app-${new Date().toISOString().split("T")[0]}.log`
);

/**
 * Ensures log directory exists
 */
async function ensureLogDirectory(): Promise<void> {
  try {
    await fs.access(LOG_DIR);
  } catch {
    await fs.mkdir(LOG_DIR, { recursive: true });
  }
}

/**
 * Formats log message with timestamp
 */
function formatLogMessage(level: string, message: string): string {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level}] ${message}\n`;
}

/**
 * Writes log to both console and file
 */
async function writeLog(level: string, message: string): Promise<void> {
  const logMessage = formatLogMessage(level, message);

  // Write to console (server console, not browser)
  if (level === "ERROR") {
    console.error(logMessage.trim());
  } else {
    console.log(logMessage.trim());
  }

  // Write to file
  try {
    await ensureLogDirectory();
    await fs.appendFile(LOG_FILE, logMessage, "utf-8");
  } catch (error) {
    // Silently fail if file write fails (don't break the app)
    console.error("Failed to write to log file:", error);
  }
}

export const logger = {
  info: (message: string) => writeLog("INFO", message),
  warn: (message: string) => writeLog("WARN", message),
  error: (message: string) => writeLog("ERROR", message),
  debug: (message: string) => writeLog("DEBUG", message),
};
