class PaginationUtils {
  /**
   * Menghitung parameter limit dan offset untuk query SQL.
   * @param {number} page - Halaman ke berapa (default 1)
   * @param {number} pageSize - Jumlah data per halaman (default 10)
   */
  static getPaginationParams(page, pageSize) {
    const p = Number(page) || 1;
    const limit = Number(pageSize) || 10;
    const offset = (p - 1) * limit;

    return { page: p, limit, offset };
  }

  /**
   * Membuat amplop metadata untuk response API.
   */
  static buildMeta(page, limit, totalData) {
    return {
      page: Number(page),
      limit: Number(limit),
      totalData: Number(totalData),
      totalPages: Math.ceil(totalData / limit),
      hasNextPage: page * limit < totalData,
      hasPrevPage: page > 1,
    };
  }
}

module.exports = PaginationUtils;
