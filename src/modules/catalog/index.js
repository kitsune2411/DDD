const MySQLCatalogRepository = require('./infrastructure/persistence/MySQLCatalogRepository');
const CreateCatalog = require('./application/use-cases/CreateCatalog');
const GetCatalogList = require('./application/queries/GetCatalogList');
const CatalogController = require('./interface/http/CatalogController');
const createRouter = require('./interface/http/catalogRoutes');

/** @param {import('mysql2/promise').Pool} dbPool */
module.exports = (dbPool) => {
  // 1. Setup Infra (Write Side)
  const repo = new MySQLCatalogRepository(dbPool);

  // 2. Setup Application (Use Cases & Queries)
  const createUseCase = new CreateCatalog(repo);
  const getListQuery = new GetCatalogList(dbPool);

  // 3. Setup Interface
  const controller = new CatalogController(createUseCase, getListQuery);
  return createRouter(controller);
};
