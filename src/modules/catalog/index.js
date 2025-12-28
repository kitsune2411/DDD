const MySQLCatalogRepository = require('./infrastructure/MySQLCatalogRepository');
const CreateCatalogService = require('./application/CreateCatalogService');
const CatalogController = require('./interface/http/CatalogController');
const createRouter = require('./interface/http/catalogRoutes');

/** @param {import('mysql2/promise').Pool} dbPool */
module.exports = (dbPool) => {
  const repo = new MySQLCatalogRepository(dbPool);
  const service = new CreateCatalogService(repo);
  const controller = new CatalogController(service);
  return createRouter(controller);
};
