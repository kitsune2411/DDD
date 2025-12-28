const Catalog = require('../domain/Catalog');

class CreateCatalogService {
  constructor(repo) {
    this.repo = repo;
  }

  async execute(dto) {
    const entity = new Catalog({ name: dto.name });
    await this.repo.save(entity);
    return entity;
  }
}
module.exports = CreateCatalogService;
