// 1. Import konfigurasi terpusat
// Kita menggunakan 'path relative' karena module-alias tidak jalan di CLI Knex standar
const dbConfig = require("./src/config/database");

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
module.exports = {
  // Konfigurasi untuk Local Laptop
  development: {
    ...dbConfig,
    // Debug true agar terlihat query SQL-nya di terminal saat migrate
    debug: true,
  },

  // Konfigurasi untuk Server Staging (Test Server)
  staging: {
    ...dbConfig,
    pool: {
      min: 2,
      max: 10,
    },
  },

  // Konfigurasi untuk Server Production (Live)
  production: {
    ...dbConfig,
    pool: {
      min: 2,
      max: 10,
    },
  },
};
