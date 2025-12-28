const winston = require("winston");
require("winston-daily-rotate-file");
const path = require("path");

// Tentukan level log berdasarkan environment
const level = process.env.NODE_ENV === "development" ? "debug" : "info";

// Konfigurasi warna untuk Console (agar mata developer senang)
const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "white",
};
winston.addColors(colors);

// Format Custom untuk Development (Human Readable)
// Output: 2023-10-27 10:00:00 [INFO]: User login success
const devFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => `${info.timestamp} [${info.level}]: ${info.message}`)
);

// Format Custom untuk Production (Machine Readable / JSON)
const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }), // Sertakan stack trace error
  winston.format.json()
);

// --- TRANSPORTS (Tempat log disimpan) ---

// 1. Console Transport (Tampil di terminal)
const transports = [
  new winston.transports.Console({
    format: process.env.NODE_ENV === "development" ? devFormat : prodFormat,
  }),
];

// 2. File Transport (Hanya aktif di Production/Staging agar laptop tidak penuh sampah)
if (process.env.NODE_ENV !== "development") {
  const logDir = "logs";

  // File Khusus Error (Merah)
  transports.push(
    new winston.transports.DailyRotateFile({
      filename: path.join(logDir, "error-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      zippedArchive: true, // Compress log lama jadi .gzip
      maxSize: "20m", // Ukuran max per file
      maxFiles: "14d", // Hapus log yang lebih tua dari 14 hari
      level: "error",
    })
  );

  // File Gabungan (Semua log masuk sini)
  transports.push(
    new winston.transports.DailyRotateFile({
      filename: path.join(logDir, "combined-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "14d",
    })
  );
}

const Logger = winston.createLogger({
  level,
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
  },
  transports,
});

module.exports = Logger;
