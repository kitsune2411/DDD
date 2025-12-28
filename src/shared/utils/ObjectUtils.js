class ObjectUtils {
  /**
   * Menghapus properti yang null atau undefined dari object.
   * Berguna sebelum menyimpan config atau update query.
   */
  static removeUndefined(obj) {
    return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v != null));
  }

  /**
   * Memilih hanya key tertentu dari object (White-listing).
   * Contoh: ObjectUtils.pick(req.body, ['name', 'email'])
   */
  static pick(obj, keys) {
    return keys.reduce((acc, key) => {
      if (obj && Object.prototype.hasOwnProperty.call(obj, key)) {
        acc[key] = obj[key];
      }
      return acc;
    }, {});
  }

  /**
   * Membuang key tertentu dari object (Black-listing).
   * Contoh: ObjectUtils.omit(user, ['password', 'salt'])
   */
  static omit(obj, keys) {
    const clone = { ...obj };
    keys.forEach((key) => delete clone[key]);
    return clone;
  }
}

module.exports = ObjectUtils;
