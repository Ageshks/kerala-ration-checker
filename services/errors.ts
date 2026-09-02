/**
 * Error model for the scraper layer.
 *
 * Every error raised while talking to an external source is normalized into a
 * ScrapeError with a machine-readable `kind` so UI components can render a
 * friendly, honest message instead of raw stack traces.
 */

export type ScrapeErrorKind =
  | "SOURCE_UNAVAILABLE"
  | "TIMEOUT"
  | "RATE_LIMITED"
  | "PARSE_ERROR"
  | "NOT_FOUND"
  | "INVALID_INPUT"
  | "NETWORK";

export class ScrapeError extends Error {
  readonly kind: ScrapeErrorKind;
  readonly source?: string;

  constructor(kind: ScrapeErrorKind, message: string, source?: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "ScrapeError";
    this.kind = kind;
    this.source = source;
  }

  static fromUnknown(err: unknown, source?: string): ScrapeError {
    if (err instanceof ScrapeError) return err;
    if (err instanceof Error) {
      return new ScrapeError("NETWORK", err.message, source, { cause: err });
    }
    return new ScrapeError("NETWORK", "Unknown error", source, { cause: err });
  }

  get userMessage(): string {
    switch (this.kind) {
      case "SOURCE_UNAVAILABLE":
      case "TIMEOUT":
      case "NETWORK":
        return "Unable to retrieve the latest ration availability information at the moment. Please try again later.";
      case "RATE_LIMITED":
        return "Too many requests. Please wait a moment and try again.";
      case "PARSE_ERROR":
        return "The official website has changed its layout. Our data readers have been notified; please try again later.";
      case "NOT_FOUND":
        return "No matching ration store was found. Please check the number and try again.";
      case "INVALID_INPUT":
        return "Please enter a valid value and try again.";
      default:
        return "Something went wrong. Please try again later.";
    }
  }
}

export function isScrapeError(err: unknown): err is ScrapeError {
  return err instanceof ScrapeError;
}