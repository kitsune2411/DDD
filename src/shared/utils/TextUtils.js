const crypto = require("crypto");

class TextUtils {
  /**
   * Membuat URL Slug yang aman.
   * Input: "Halo Dunia & Coding!" -> Output: "halo-dunia-coding"
   */
  static slugify(text) {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-") // Ganti spasi dengan -
      .replace(/[^\w\-]+/g, "") // Hapus karakter non-word
      .replace(/\-\-+/g, "-"); // Ganti dash berulang (--) jadi satu (-)
  }

  /**
   * Membuat string acak (Hex). Cocok untuk nama file upload atau token verifikasi email.
   * Tidak disarankan untuk password hashing (Gunakan Bcrypt untuk itu).
   */
  static randomString(length = 16) {
    return crypto.randomBytes(length).toString("hex");
  }

  /**
   * Membuat UUID v4 (Jika Anda tidak mau import library uuid di mana-mana)
   */
  static generateUUID() {
    return crypto.randomUUID();
  }

  /**
   * Mengubah huruf pertama jadi kapital.
   * Input: "halo" -> Output: "Halo"
   */
  static capitalize(text) {
    if (!text) return "";
    return text.charAt(0).toUpperCase() + text.slice(1);
  }
}

module.exports = TextUtils;
