/**
 * AppError
 *
 * Custom error class for all application errors
 *
 * Distinguishes between:
 * - Operational Errors: Expected, predictable errors (validation, not found, etc.)
 * - Programming Errors: Bugs in code (should crash process)
 *
 * Operational errors are caught by errorHandler middleware and sent to client.
 * Programming errors crash the process (safer for data consistency).
 *
 * @extends Error
 *
 * @example
 * // User not found
 * throw new AppError('User not found', 404);
 *
 * // Validation error with details
 * throw new AppError('Validation failed', 422, [
 *   { field: 'email', message: 'Invalid format' }
 * ]);
 *
 * // Server error
 * throw new AppError('Database error', 500);
 */
class AppError extends Error {
  /**
   * Create a new application error
   *
   * @param {string} message - User-friendly error message
   * @param {number} [statusCode=500] - HTTP status code
   *   - 4xx: Client error (bad request, validation, not found)
   *   - 5xx: Server error (database, external service)
   * @param {any} [details=null] - Additional error details
   *   - Validation errors array
   *   - Database error info
   *   - External service error
   *
   * @throws {Error} Automatically captures stack trace
   *
   * @example
   * throw new AppError('Email already exists', 409);
   * throw new AppError('Invalid input', 400, { field: 'age', issue: 'Must be >= 18' });
   */
  constructor(message, statusCode = 500, details = null) {
    super(message);

    /**
     * HTTP status code
     * @type {number}
     */
    this.statusCode = statusCode;

    /**
     * Error status: 'fail' for 4xx, 'error' for 5xx
     * Used to categorize errors in responses
     * @type {string}
     */
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";

    /**
     * Flag marking this as an operational (expected) error
     * Operational errors are caught and sent to clients
     * Programming errors crash the process
     * @type {boolean}
     */
    this.isOperational = true;

    /**
     * Additional error context
     * Examples:
     * - Array of validation errors
     * - Database error details
     * - External API error response
     * @type {any}
     */
    this.details = details;

    // Capture stack trace for debugging
    // Excludes AppError class from trace for cleaner logs
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
