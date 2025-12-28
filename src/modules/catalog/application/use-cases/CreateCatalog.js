const Catalog = require('../../domain/Catalog');

class CreateCatalog {
  /** @param {import('../../domain/ICatalogRepository')} repo */
  constructor(repo) {
    this.repo = repo;
  }

  /** @param {{ name: string }} dto */
  async execute(dto) {
    const entity = new Catalog({ name: dto.name });
    await this.repo.save(entity);
    return entity;
  }
}
module.exports = CreateCatalog;
