const ICatalogRepository = require('../../domain/ICatalogRepository');
const CatalogMap = require('../../mapper/CatalogMap');

class MySQLCatalogRepository extends ICatalogRepository {
  /** @param {import('mysql2/promise').Pool} dbPool */
  constructor(dbPool) {
    super();
    this.db = dbPool;
    this.tableName = 'catalogs';
  }

  /** @param {import('../../domain/Catalog')} entity */
  async save(entity) {
    const raw = CatalogMap.toPersistence(entity);
    const sql = `INSERT INTO ` + this.tableName + ` (id, name, created_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name)`;
    await this.db.execute(sql, [raw.id, raw.name, raw.created_at]);
    return entity;
  }
}
module.exports = MySQLCatalogRepository;
