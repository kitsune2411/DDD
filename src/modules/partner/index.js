const createRouter = require('./interface/http/partnerRoutes');

module.exports = (dbPool) => {
  // 1. Instantiate Repository & Service
  // const repo = new MySQLpartnerRepository(dbPool);
  // const service = new CreatepartnerService(repo);
  const controller = {}; // new partnerController(service);

  return createRouter(controller);
};
