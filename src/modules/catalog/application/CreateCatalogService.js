const Catalog = require('../domain/Catalog');
const MySQLCatalogRepository = require('../infrastructure/MySQLCatalogRepository');

class CreateCatalogService {
  /** @param {MySQLCatalogRepository} repo */
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
module.exports = CreateCatalogService;
