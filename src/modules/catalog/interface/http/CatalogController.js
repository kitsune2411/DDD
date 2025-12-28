const CatalogMap = require("../../mapper/CatalogMap");
const { createCatalogSchema } = require("../dtos/CreateCatalogDTO");
const CreateCatalogService = require("../../application/CreateCatalogService");

class CatalogController {
  /** @param {CreateCatalogService} createService */
  constructor(createService) {
    this.createService = createService;
  }

  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  create = async (req, res, next) => {
    try {
      const dto = createCatalogSchema.parse(req.body);
      const result = await this.createService.execute(dto);
      res.status(201).json({ success: true, data: CatalogMap.toDTO(result) });
    } catch (error) {
      next(error);
    }
  };
}
module.exports = CatalogController;
