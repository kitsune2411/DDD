/**
 * Guard
 *
 * Guard clause utilities for defensive programming
 *
 * Guard clauses are checks at the start of a function that ensure
 * preconditions are met. They make code cleaner by failing fast
 * instead of letting invalid data propagate.
 *
 * Why use Guards?
 * ✓ Fail fast with clear error messages
 * ✓ Reduce nesting (no need for if-checks throughout the function)
 * ✓ Self-documenting code (preconditions are explicit)
 * ✓ Prevents subtle bugs from invalid data
 *
 * @example
 * // Without Guard: messy nested conditions
 * if (email !== null && email !== undefined && email.trim() !== '') {
 *   // Process email
 * }
 *
 * // With Guard: clear and safe
 * Guard.againstNullOrUndefined(email, 'Email is required');
 * Guard.againstEmptyString(email, 'Email cannot be empty');
 * // Process email safely
 */
class Guard {
  /**
   * Check if value is null or undefined
   *
   * @param {any} value - Value to check
   * @returns {boolean} true if value is null or undefined
   *
   * @example
   * if (Guard.isNullOrUndefined(userId)) {
   *   // Handle missing user ID
   * }
   */
  static isNullOrUndefined(value) {
    return value === null || value === undefined;
  }

  /**
   * Check if string is empty (after trimming whitespace)
   *
   * Considers these as empty:
   * - Empty string ""
   * - Whitespace-only "   "
   * - Not empty: "hello", " x "
   *
   * @param {any} value - Value to check
   * @returns {boolean} true if value is empty string
   *
   * @example
   * if (Guard.isEmptyString(username)) {
   *   throw new Error('Username cannot be empty');
   * }
   */
  static isEmptyString(value) {
    return typeof value === "string" && value.trim().length === 0;
  }

  /**
   * Guard clause: ensure value is not null/undefined
   *
   * Throws error immediately if value is invalid, preventing
   * further execution. Use in constructor or at function start.
   *
   * @param {any} value - Value to validate
   * @param {string} [message] - Custom error message
   * @throws {Error} Throws if value is null or undefined
   *
   * @example
   * class Order {
   *   constructor(id, customerId, items) {
   *     // Fail fast if preconditions not met
   *     Guard.againstNullOrUndefined(id, 'Order ID is required');
   *     Guard.againstNullOrUndefined(customerId, 'Customer ID is required');
   *
   *     this.id = id;
   *     this.customerId = customerId;
   *     this.items = items;
   *     // Rest of constructor can safely use these values
   *   }
   * }
   */
  static againstNullOrUndefined(value, message) {
    if (this.isNullOrUndefined(value)) {
      throw new Error(message || "Value is null or undefined");
    }
  }

  /**
   * Guard clause: ensure string is not empty
   *
   * @param {any} value - String to validate
   * @param {string} [message] - Custom error message
   * @throws {Error} Throws if value is empty string
   *
   * @example
   * class User {
   *   constructor(email) {
   *     Guard.againstEmptyString(email, 'Email cannot be empty');
   *     this.email = email;
   *   }
   * }
   */
  static againstEmptyString(value, message) {
    if (this.isEmptyString(value)) {
      throw new Error(message || "String cannot be empty");
    }
  }

  /**
   * Guard clause: ensure array is not empty
   *
   * @param {any} value - Array to validate
   * @param {string} [message] - Custom error message
   * @throws {Error} Throws if array is null, undefined, or empty
   *
   * @example
   * class Order {
   *   constructor(items) {
   *     Guard.againstEmptyArray(items, 'Order must have at least one item');
   *     this.items = items;
   *   }
   * }
   */
  static againstEmptyArray(value, message) {
    if (!Array.isArray(value) || value.length === 0) {
      throw new Error(message || "Array cannot be empty");
    }
  }

  /**
   * Guard clause: ensure value is positive number
   *
   * @param {any} value - Number to validate
   * @param {string} [message] - Custom error message
   * @throws {Error} Throws if not a positive number
   *
   * @example
   * class OrderItem {
   *   constructor(productId, quantity, price) {
   *     Guard.againstNegativeOrZero(quantity, 'Quantity must be > 0');
   *     Guard.againstNegativeOrZero(price, 'Price must be > 0');
   *     this.quantity = quantity;
   *     this.price = price;
   *   }
   * }
   */
  static againstNegativeOrZero(value, message) {
    if (typeof value !== "number" || value <= 0) {
      throw new Error(message || "Value must be a positive number");
    }
  }
}

module.exports = Guard;
