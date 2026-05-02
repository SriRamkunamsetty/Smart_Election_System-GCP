/**
 * @module logger
 * Structured logging utility for Google Cloud Run.
 *
 * Cloud Run automatically captures `stdout`/`stderr` and routes to Cloud Logging.
 * When logs are JSON-formatted with a `severity` field, Cloud Logging automatically
 * parses them and assigns the correct log level in the Logs Explorer.
 *
 * @see https://cloud.google.com/run/docs/logging
 * @see https://cloud.google.com/logging/docs/structured-logging
 */

/** Supported Cloud Logging severity levels. */
type Severity = "DEBUG" | "INFO" | "WARNING" | "ERROR" | "CRITICAL";

interface StructuredLog {
  severity: Severity;
  message: string;
  component?: string;
  [key: string]: unknown;
}

/**
 * Emits a structured JSON log entry compatible with Google Cloud Logging.
 * In development, falls back to standard console methods for readability.
 *
 * @param severity - The Cloud Logging severity level.
 * @param message  - A human-readable log message.
 * @param meta     - Optional structured metadata (component name, request IDs, etc.).
 */
function log(severity: Severity, message: string, meta?: Record<string, unknown>): void {
  const entry: StructuredLog = {
    severity,
    message,
    timestamp: new Date().toISOString(),
    ...meta,
  };

  // In production (Cloud Run), emit JSON to stdout for Cloud Logging ingestion.
  // In dev, use standard console for colored/readable output.
  if (process.env.NODE_ENV === "production") {
    const line = JSON.stringify(entry);
    if (severity === "ERROR" || severity === "CRITICAL") {
      process.stderr?.write?.(line + "\n");
    } else {
      process.stdout?.write?.(line + "\n");
    }
  } else {
    const consoleFn =
      severity === "ERROR" || severity === "CRITICAL"
        ? console.error
        : severity === "WARNING"
          ? console.warn
          : severity === "DEBUG"
            ? console.debug
            : console.log;
    consoleFn(`[${severity}] ${message}`, meta ?? "");
  }
}

/** Log an informational message. */
export function info(message: string, meta?: Record<string, unknown>): void {
  log("INFO", message, meta);
}

/** Log a warning. */
export function warn(message: string, meta?: Record<string, unknown>): void {
  log("WARNING", message, meta);
}

/** Log an error with optional exception context. */
export function error(message: string, meta?: Record<string, unknown>): void {
  log("ERROR", message, meta);
}

/** Log a debug message (suppressed in production Cloud Logging by default). */
export function debug(message: string, meta?: Record<string, unknown>): void {
  log("DEBUG", message, meta);
}

/** Log a critical/fatal error. */
export function critical(message: string, meta?: Record<string, unknown>): void {
  log("CRITICAL", message, meta);
}
