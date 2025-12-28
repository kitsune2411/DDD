const nodemailer = require("nodemailer");
const fs = require("fs/promises"); // Untuk baca file
const path = require("path");
const handlebars = require("handlebars");
const Logger = require("../logging/Logger");

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // --- Helper: Baca & Compile Template ---
  async _loadTemplate(templateName, data) {
    try {
      // Cari file di folder templates
      const filePath = path.join(__dirname, "templates", `${templateName}.hbs`);

      // Baca file HTML mentah
      const source = await fs.readFile(filePath, "utf-8");

      // Compile pakai Handlebars
      const template = handlebars.compile(source);

      // Masukkan data ke dalam template (Replace {{variable}})
      return template(data);
    } catch (error) {
      Logger.error(`Gagal load template: ${templateName}`, error);
      throw new Error("Email template not found");
    }
  }

  /**
   * Kirim Email menggunakan Template
   * @param {string} to - Penerima
   * @param {string} subject - Judul
   * @param {string} templateName - Nama file tanpa .hbs (misal: 'order-confirmation')
   * @param {object} data - Data JSON untuk mengisi template
   */
  async sendWithTemplate(to, subject, templateName, data) {
    // 1. Generate HTML dari file template
    const htmlContent = await this._loadTemplate(templateName, data);

    // 2. Kirim
    return this.transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      html: htmlContent,
    });
  }
}

module.exports = new EmailService();
