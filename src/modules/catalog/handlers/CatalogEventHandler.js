const Logger = require('@shared/infra/logging/Logger');

/** @param {{ id: string }} event */
const handleCreated = async (event) => {
  Logger.info(`Handling event for catalog: `);
};

module.exports = { handleCreated };
