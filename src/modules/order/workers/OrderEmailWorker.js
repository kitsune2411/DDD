const { createWorker } = require("@shared/infra/queue/queueFactory");
const Logger = require("@shared/infra/logging/Logger");
const emailService = require("@shared/infra/email/EmailService");
const DateUtils = require("@shared/utils/DateUtils");

const QUEUE_NAME = "order-email-queue";

const processor = async (job) => {
  const { orderId, userEmail, total } = job.data;

  Logger.info(`📨 Mengirim email template ke ${userEmail}...`);

  // Kirim pakai Template!
  // Kita inject data yang dibutuhkan oleh file .hbs
  await emailService.sendWithTemplate(
    userEmail,
    `Konfirmasi Pesanan #${orderId}`, // Subject
    "order-confirmation", // Nama file template (order-confirmation.hbs)
    {
      customerEmail: userEmail,
      orderId: orderId,
      orderDate: DateUtils.formatFriendly(new Date()),
      totalAmount: total.toLocaleString("id-ID"), // Format Rupiah
    }
  );

  Logger.info(`✅ Email template sukses terkirim ke ${userEmail}`);
};

const initWorker = () => {
  createWorker(QUEUE_NAME, processor);
};

module.exports = { initWorker, QUEUE_NAME };
