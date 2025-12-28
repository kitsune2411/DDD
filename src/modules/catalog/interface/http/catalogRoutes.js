const router = require('express').Router();
module.exports = (controller) => {
  router.post('/', controller.create);
  router.get('/', controller.list);
  return router;
};
