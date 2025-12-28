const CatalogMap = require('../../mapper/CatalogMap');
const { createCatalogSchema } = require('../dtos/CreateCatalogDTO');

class CatalogController {
  /**
   * @param {import('../../application/use-cases/CreateCatalog')} createUseCase
   * @param {import('../../application/queries/GetCatalogList')} getListQuery
   */
  constructor(createUseCase, getListQuery) {
    this.createUseCase = createUseCase;
    this.getListQuery = getListQuery;
  }

  create = async (req, res, next) => {
    try {
      const dto = createCatalogSchema.parse(req.body);
      const result = await this.createUseCase.execute(dto);
      res.status(201).json({ success: true, data: CatalogMap.toDTO(result) });
    } catch (e) { next(e); }
  }

  list = async (req, res, next) => {
    try {
      const data = await this.getListQuery.execute();
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }
}
module.exports = CatalogController;
