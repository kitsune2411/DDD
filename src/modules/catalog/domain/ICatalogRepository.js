/** @abstract */
class ICatalogRepository {
  /** @param {import('./Catalog')} entity */
  async save(entity) { throw new Error('Not implemented'); }
}
module.exports = ICatalogRepository;
