require("dotenv").config();
const { z } = require("zod");

// 1. Definisikan Schema Environment yang Wajib Ada
const envSchema = z.object({
  DB_HOST: z.string({ required_error: "DB_HOST wajib diisi di .env" }),
  DB_USER: z.string({ required_error: "DB_USER wajib diisi di .env" }),
  // Password boleh string kosong, tapi harus ada key-nya
  DB_PASS: z.string().default(""),
  DB_NAME: z.string({ required_error: "DB_NAME wajib diisi di .env" }),
  // Coerce: Paksa ubah String (.env) jadi Number
  DB_PORT: z.coerce.number().default(3306),
  DB_POOL_MIN: z.coerce.number().default(2),
  DB_POOL_MAX: z.coerce.number().default(10),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

// 2. Lakukan Validasi
const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("❌ FATAL ERROR: Invalid Environment Variables");

  // Format error biar enak dibaca manusia
  const formattedErrors = _env.error.format();

  Object.keys(formattedErrors).forEach((key) => {
    if (key !== "_errors") {
      console.error(`   - ${key}: ${formattedErrors[key]._errors.join(", ")}`);
    }
  });

  process.exit(1); // Matikan Server Seketika
}

// 3. Ambil data yang sudah ter-validasi (ada type safety-nya)
const env = _env.data;

// 4. Export Config
const dbConfig = {
  client: "mysql2",
  connection: {
    host: env.DB_HOST,
    user: env.DB_USER,
    password: env.DB_PASS,
    database: env.DB_NAME,
    port: env.DB_PORT,
    dateStrings: true,
    connectionLimit: env.DB_POOL_MAX,
    // queueLimit: 0
  },
  pool: {
    min: env.DB_POOL_MIN,
    max: env.DB_POOL_MAX,
  },
  migrations: {
    tableName: "knex_migrations",
    directory: "./migrations",
  },
  // Debug query hanya jika development
  debug: env.NODE_ENV === "development",
};

module.exports = dbConfig;
