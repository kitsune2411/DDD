const Catalog = require('../domain/Catalog');
const DateUtils = require('@shared/utils/DateUtils');

class CatalogMap {
  static toDomain(raw) {
    if (!raw) return null;
    return new Catalog({
      id: raw.id,
      name: raw.name,
      createdAt: raw.created_at
    });
  }

  static toPersistence(entity) {
    return {
      id: entity.id,
      name: entity.name,
      created_at: entity.createdAt
    };
  }

  static toDTO(entity) {
    return {
      id: entity.id,
      name: entity.name,
      createdAt: DateUtils.toISOString(entity.createdAt)
    };
  }
}
module.exports = CatalogMap;
