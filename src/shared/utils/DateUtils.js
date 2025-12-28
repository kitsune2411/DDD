const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");

// Load plugin
dayjs.extend(utc);
dayjs.extend(timezone);

class DateUtils {
  /**
   * Mengembalikan waktu sekarang dalam format Date Object JS (UTC).
   * Gunakan ini untuk field 'created_at' di Entity/DB.
   */
  static now() {
    return dayjs.utc().toDate();
  }

  /**
   * Mengubah input tanggal apa saja menjadi string UTC ISO 8601.
   * Contoh Output: "2023-10-27T14:30:00Z"
   * Gunakan ini saat mengirim response JSON ke Frontend.
   */
  static toISOString(date) {
    return dayjs(date).utc().toISOString();
  }

  /**
   * Format tanggal untuk tampilan manusia (Laporan/Email/PDF).
   * Contoh: "27 October 2023, 14:30"
   */
  static formatFriendly(date, pattern = "DD MMMM YYYY, HH:mm") {
    return dayjs(date).format(pattern);
  }

  /**
   * Menambah waktu.
   * Contoh: DateUtils.add(new Date(), 1, 'hour');
   */
  static add(date, value, unit) {
    return dayjs(date).add(value, unit).toDate();
  }

  /**
   * Cek apakah date1 SETELAH date2
   */
  static isAfter(date1, date2) {
    return dayjs(date1).isAfter(dayjs(date2));
  }
}

module.exports = DateUtils;
