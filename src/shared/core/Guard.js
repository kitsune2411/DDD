class Guard {
  /**
   * Cek apakah value null atau undefined
   */
  static isNullOrUndefined(value) {
    return value === null || value === undefined;
  }

  /**
   * Cek string kosong
   */
  static isEmptyString(value) {
    return typeof value === "string" && value.trim().length === 0;
  }

  /**
   * Memastikan argumen valid, kalau tidak throw Error
   * Contoh: Guard.againstNullOrUndefined(email, 'Email tidak boleh kosong');
   */
  static againstNullOrUndefined(value, message) {
    if (this.isNullOrUndefined(value)) {
      throw new Error(message || "Value is null or undefined");
    }
  }
}

module.exports = Guard;
