class AppError extends Error {
  /**
   * @param {string} message - Pesan error untuk user
   * @param {number} statusCode - HTTP Code (400, 401, 404, etc)
   * @param {any} details - (Opsional) Detail tambahan, misal array validasi error
   */
  constructor(message, statusCode = 500, details = null) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true; // Menandakan ini error yang KITA PREDIKSI (bukan bug crash)
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
