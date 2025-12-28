const AppError = require('@shared/core/AppError');
const { v4: uuidv4 } = require('uuid');

class Catalog {
  constructor({ id, name, createdAt }) {
    this.id = id || uuidv4();
    this.name = name;
    this.createdAt = createdAt || new Date();
    this.validate();
  }

  validate() {
    if (!this.name) throw new AppError('Name is required');
  }
}
module.exports = Catalog;
