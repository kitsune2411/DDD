const router = require('express').Router();

/** @param {import('./CatalogController')} controller */
module.exports = (controller) => {
  router.post('/', controller.create);
  return router;
};
