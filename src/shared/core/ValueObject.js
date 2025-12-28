/**
 * ValueObject
 *
 * Base class for all value objects in the domain layer
 *
 * A Value Object is an immutable, identityless object that represents
 * a concept in the domain. It has no unique identifier; equality is
 * determined by its attributes.
 *
 * Examples:
 * - Money: $100 USD equals any other $100 USD (identity doesn't matter)
 * - Email: john@example.com is always john@example.com (value matters, not id)
 * - Address: "123 Main St" is identical whether created from different places
 *
 * Key Characteristics:
 * ✓ Immutable: Cannot change after creation
 * ✓ No identity: Two instances with same values are equal
 * ✓ Reusable: Can be used across multiple aggregates
 * ✓ Encapsulates logic: Validation logic lives on the value object
 *
 * @abstract
 *
 * @example
 * class Email extends ValueObject {
 *   constructor(value) {
 *     super();
 *     if (!this.isValidEmail(value)) {
 *       throw new Error('Invalid email format');
 *     }
 *     this.value = value; // Immutable
 *   }
 *
 *   isValidEmail(email) {
 *     return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
 *   }
 * }
 *
 * // Usage
 * const email1 = new Email('john@example.com');
 * const email2 = new Email('john@example.com');
 * console.log(email1.equals(email2)); // true (same value)
 * console.log(email1 === email2); // false (different objects)
 *
 * @example
 * class Money extends ValueObject {
 *   constructor(amount, currency = 'USD') {
 *     super();
 *     if (amount < 0) throw new Error('Amount cannot be negative');
 *     this.amount = Object.freeze(amount); // Immutable
 *     this.currency = currency;
 *   }
 *
 *   add(other) {
 *     if (this.currency !== other.currency) {
 *       throw new Error('Cannot add different currencies');
 *     }
 *     return new Money(this.amount + other.amount, this.currency);
 *   }
 * }
 */
class ValueObject {
  /**
   * Compare this value object with another
   *
   * Two value objects are equal if:
   * 1. They are the same type (class)
   * 2. Their attributes have the same values
   *
   * Comparison uses JSON serialization for simplicity.
   * This works well for flat value objects. For complex nested
   * structures, override this method.
   *
   * @param {ValueObject} other - Another value object to compare
   * @returns {boolean} true if both have same type and values
   *
   * @example
   * class Color extends ValueObject {
   *   constructor(r, g, b) {
   *     this.r = r;
   *     this.g = g;
   *     this.b = b;
   *   }
   * }
   *
   * const red1 = new Color(255, 0, 0);
   * const red2 = new Color(255, 0, 0);
   * const blue = new Color(0, 0, 255);
   *
   * red1.equals(red2); // true (same values)
   * red1.equals(blue); // false (different values)
   * red1.equals(null); // false (null is not a value object)
   * red1.equals({}); // false (different type)
   */
  equals(other) {
    // Null check: value objects cannot equal null
    if (other === null || other === undefined) {
      return false;
    }

    // Type check: must be same class
    if (other.constructor.name !== this.constructor.name) {
      return false;
    }

    // Value check: JSON serialization
    // Works for flat objects; override for nested structures
    return JSON.stringify(this) === JSON.stringify(other);
  }
}

module.exports = ValueObject;
