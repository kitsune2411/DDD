// 1. Module Alias (WAJIB PALING ATAS)
// Ini membuat Node.js mengerti simbol '@shared', '@modules', dll.
require("module-alias/register");

// 2. Core Dependencies
const http = require("http");
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

// 3. Internal Imports (Perhatikan betapa bersihnya pakai alias)
const dbPool = require("@shared/infra/database/connection"); // Singleton DB
const errorHandler = require("@shared/infra/http/errorHandler");
const httpLogger = require("@shared/infra/logging/HttpLogger");
const AppError = require("@shared/core/AppError");

// 4. Import Modules (Bounded Contexts)
const orderModule = require("@modules/order");
const partnerModule = require("@modules/partner");
// const userModule = require('@modules/user'); // Contoh modul lain nanti

// 5. Init Express
const app = express();

// =================================================================
// A. GLOBAL MIDDLEWARE
// =================================================================

// Security Headers (Anti XSS, dll)
app.use(helmet());

// Cross Origin Resource Sharing
// Di production, ganti origin '*' dengan domain frontend Anda
app.use(cors({ origin: "*", credentials: true }));

// Rate Limiting (Anti DDoS/Spam - Maks 100 request per 15 menit)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 100, // limit tiap IP, 100 request/windowMs
  standardHeaders: true, // Return rate limit info di header `RateLimit-*`
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  message: { success: false, message: "Terlalu banyak request, santai dulu." }, // Pesan saat limit terlampaui
});
app.use(limiter);

// Logging HTTP Request (Method, URL, Duration)
app.use(httpLogger);

// Body Parser (Agar bisa baca req.body JSON)
app.use(express.json());

// =================================================================
// B. SYSTEM ROUTES
// =================================================================

// Health Check (Penting untuk Load Balancer / Kubernetes)
app.get("/health", async (req, res) => {
  try {
    // Cek koneksi DB dengan query ringan
    await dbPool.query("SELECT 1");
    res.status(200).json({ status: "OK", uptime: process.uptime(), db: "Connected" });
  } catch (error) {
    res.status(503).json({ status: "ERROR", db: "Disconnected", error: error.message });
  }
});

// Swagger Documentation (Jika Anda setup Swagger)
// const swaggerUi = require('swagger-ui-express');
// const swaggerSpec = require('@shared/infra/docs/swaggerConfig');
// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// =================================================================
// C. MODULE WIRING (MAIN APP)
// =================================================================

// Kita suntikkan (Inject) dbPool ke setiap modul.
// Ini membuat modul Order independen, dia tidak hardcode import DB.
app.use("/api/orders", orderModule(dbPool));
app.use("/api/partner", partnerModule(dbPool));
// app.use('/api/users', userModule(dbPool));

// =================================================================
// D. ERROR HANDLING
// =================================================================

// 404 Handler (Jika route tidak ditemukan)
app.use((req, res, next) => {
  next(new AppError(`URL ${req.originalUrl} tidak ditemukan di server ini`, 404));
});

// Global Error Handler (Wajib paling bawah)
app.use(errorHandler);

// =================================================================
// E. SERVER START
// =================================================================

const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`=================================`);
  console.log(`🚀 Server running on PORT ${PORT}`);
  console.log(`env: ${process.env.NODE_ENV}`);
  console.log(`=================================`);
});

// =================================================================
// F. GRACEFUL SHUTDOWN
// =================================================================

const shutdown = (signal) => {
  console.log(`\n${signal} received. Closing server...`);

  server.close(async () => {
    console.log("HTTP Server closed.");

    try {
      await dbPool.end(); // Tutup koneksi MySQL
      console.log("MySQL Connection closed.");
      process.exit(0);
    } catch (err) {
      console.error("Error during shutdown:", err);
      process.exit(1);
    }
  });
};

// Menangkap sinyal matikan dari OS atau Terminal (Ctrl+C)
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// =================================================================
// G. EXPORT APP (UNTUK TESTING)
// =================================================================
module.exports = app;
