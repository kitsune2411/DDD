class ValueObject {
  /**
   * Mengecek apakah Value Object ini sama dengan yang lain.
   * Menggunakan shallow comparison JSON stringify (cara simpel & efektif).
   */
  equals(other) {
    if (other === null || other === undefined) {
      return false;
    }

    if (other.constructor.name !== this.constructor.name) {
      return false;
    }

    return JSON.stringify(this) === JSON.stringify(other);
  }
}

module.exports = ValueObject;
