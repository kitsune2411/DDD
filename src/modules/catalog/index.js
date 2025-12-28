const MySQLCatalogRepository = require('./infrastructure/MySQLCatalogRepository');
const CreateCatalogService = require('./application/CreateCatalogService');
const CatalogController = require('./interface/http/CatalogController');
const createRouter = require('./interface/http/catalogRoutes');

module.exports = (dbPool) => {
  const repo = new MySQLCatalogRepository(dbPool);
  const service = new CreateCatalogService(repo);
  const controller = new CatalogController(service);
  return createRouter(controller);
};
