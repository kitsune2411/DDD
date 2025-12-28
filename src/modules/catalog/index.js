const MySQLCatalogRepository = require('./infrastructure/persistence/MySQLCatalogRepository');
const CreateCatalog = require('./application/use-cases/CreateCatalog');
const GetCatalogList = require('./application/queries/GetCatalogList');
const CatalogController = require('./interface/http/CatalogController');
const createRouter = require('./interface/http/catalogRoutes');

/** @param {import('mysql2/promise').Pool} dbPool */
module.exports = (dbPool) => {
  const repo = new MySQLCatalogRepository(dbPool);
  const createUseCase = new CreateCatalog(repo);
  const getListQuery = new GetCatalogList(dbPool);
  const controller = new CatalogController(createUseCase, getListQuery);
  return createRouter(controller);
};
