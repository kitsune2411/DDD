const Logger = require('@shared/infra/logging/Logger');

/**
 * Handle Domain Event: CatalogCreated
 * @param {{ id: string, name: string }} event
 */
const handleCreated = async (event) => {
  Logger.info(`[CatalogHandler] Handling Created Event: `);
  // TODO: Add side-effects here (e.g. Send Email, Update Stats)
};

module.exports = { handleCreated };
