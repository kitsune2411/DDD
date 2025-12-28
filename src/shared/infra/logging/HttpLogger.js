const morgan = require("morgan");
const Logger = require("./Logger");

// Tentukan format morgan berdasarkan environment
// 'dev' ringkas & berwarna, 'combined' standar Apache (lengkap dengan User-Agent & IP)
const format = process.env.NODE_ENV === "development" ? "dev" : "combined";

// Buat Stream: Morgan akan menulis ke sini, lalu kita lempar ke Winston
const stream = {
  write: (message) => {
    // Gunakan level 'http' di Winston, dan hapus baris baru (\n) di akhir pesan morgan
    Logger.http(message.trim());
  },
};

// Middleware siap pakai
const httpLogger = morgan(format, { stream });

module.exports = httpLogger;
