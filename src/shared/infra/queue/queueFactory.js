const { Queue, Worker } = require("bullmq");

// Koneksi ke Redis Container
const connection = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: Number(process.env.REDIS_PORT) || 6379,
};

/**
 * PRODUCER: Membuat Antrian baru
 * @param {string} name - Nama antrian (misal: 'email-queue')
 */
const createQueue = (name) => {
  return new Queue(name, { connection });
};

/**
 * CONSUMER: Membuat Worker untuk memproses tugas
 * @param {string} name - Nama antrian yang mau dikerjakan
 * @param {function} processor - Function logic
 */
const createWorker = (name, processor) => {
  return new Worker(name, processor, {
    connection,
    concurrency: 5, // Bisa kerjakan 5 tugas sekaligus per worker
  });
};

module.exports = { createQueue, createWorker };
