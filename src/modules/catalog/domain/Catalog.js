const AggregateRoot = require('@shared/core/AggregateRoot');
const AppError = require('@shared/core/AppError');
const { v4: uuidv4 } = require('uuid');

class Catalog extends AggregateRoot {
  /**
   * @param {object} props
   * @param {string} [props.id]
   * @param {string} props.name
   * @param {Date} [props.createdAt]
   */
  constructor({ id, name, createdAt }) {
    super();
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
