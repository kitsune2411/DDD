const CatalogMap = require('../mapper/CatalogMap');

class MySQLCatalogRepository {
  constructor(dbPool) {
    this.db = dbPool;
    this.tableName = 'catalogs';
  }

  async save(entity) {
    const raw = CatalogMap.toPersistence(entity);
    const sql = `INSERT INTO ` + this.tableName + ` (id, name, created_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name)`;
    await this.db.execute(sql, [raw.id, raw.name, raw.created_at]);
    return entity;
  }

  async findById(id) {
    const sql = `SELECT * FROM ` + this.tableName + ` WHERE id = ?`;
    const [rows] = await this.db.execute(sql, [id]);
    return rows.length ? CatalogMap.toDomain(rows[0]) : null;
  }
}
module.exports = MySQLCatalogRepository;
