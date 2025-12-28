const { z } = require('zod');
const createCatalogSchema = z.object({ name: z.string().min(3) });
module.exports = { createCatalogSchema };
