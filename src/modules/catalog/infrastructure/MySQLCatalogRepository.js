const CatalogMap = require('../mapper/CatalogMap');

class MySQLCatalogRepository {
  /** @param {import('mysql2/promise').Pool} dbPool */
  constructor(dbPool) {
    this.db = dbPool;
    this.tableName = 'catalogs';
  }

  /** @param {import('../domain/Catalog')} entity */
  async save(entity) {
    const raw = CatalogMap.toPersistence(entity);
    const sql = `INSERT INTO ` + this.tableName + ` (id, name, created_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name)`;
    await this.db.execute(sql, [raw.id, raw.name, raw.created_at]);
    return entity;
  }

  /** @param {string} id */
  async findById(id) {
    const sql = `SELECT * FROM ` + this.tableName + ` WHERE id = ?`;
    const [rows] = await this.db.execute(sql, [id]);
    // @ts-ignore
    return rows.length ? CatalogMap.toDomain(rows[0]) : null;
  }
}
module.exports = MySQLCatalogRepository;
