const CatalogMap = require('../../mapper/CatalogMap');
const { createCatalogSchema } = require('../dtos/CreateCatalogDTO');

class CatalogController {
  constructor(createService) {
    this.createService = createService;
  }

  create = async (req, res, next) => {
    try {
      // 1. Validasi Input via Zod (DTO)
      const dto = createCatalogSchema.parse(req.body);

      // 2. Eksekusi Service
      const result = await this.createService.execute(dto);

      // 3. Format Output via Mapper
      const response = CatalogMap.toDTO(result);

      res.status(201).json({ success: true, data: response });
    } catch (error) { next(error); }
  }
}
module.exports = CatalogController;
