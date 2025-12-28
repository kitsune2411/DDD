const { z } = require("zod");

const createCatalogSchema = z
  .object({
    name: z.string().min(3).max(100),
  })
  .strict();

/** @typedef {z.infer<typeof createCatalogSchema>} CreateCatalogDTO */

module.exports = { createCatalogSchema };
