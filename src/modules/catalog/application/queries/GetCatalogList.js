class GetCatalogList {
  /** @param {import('mysql2/promise').Pool} dbPool */
  constructor(dbPool) {
    this.db = dbPool;
  }

  async execute() {
    // Direct SQL for Performance (Bypass Domain)
    const sql = `SELECT id, name, created_at FROM catalogs LIMIT 50`;
    const [rows] = await this.db.execute(sql);
    return rows;
  }
}
module.exports = GetCatalogList;
