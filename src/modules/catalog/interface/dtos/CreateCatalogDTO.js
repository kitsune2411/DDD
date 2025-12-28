const { z } = require('zod');

// Skema Validasi Input
const createCatalogSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(100),
});

module.exports = { createCatalogSchema };
