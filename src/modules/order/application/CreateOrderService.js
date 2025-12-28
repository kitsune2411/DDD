const { createQueue } = require("@shared/infra/queue/queueFactory");
const { QUEUE_NAME } = require("../workers/OrderEmailWorker"); // Import nama queue

class CreateOrderService {
  constructor(orderRepo) {
    this.orderRepo = orderRepo;
    // Inisialisasi Queue Producer
    this.emailQueue = createQueue(QUEUE_NAME);
  }

  async execute(dto) {
    // 1. Logic Simpan Order ke Database (Cepat)
    const order = await this.orderRepo.save(dto);

    // 2. Masukkan tugas kirim email ke Queue (Sangat Cepat - <10ms)
    // Parameter: (Nama Job, Data JSON)
    await this.emailQueue.add(
      "send-confirmation",
      {
        orderId: order.id,
        userEmail: dto.email, // Anggap ada email di DTO
        total: order.total,
      },
      {
        attempts: 3, // Kalau gagal, coba ulang 3x
        backoff: 5000, // Jeda 5 detik sebelum coba ulang
      }
    );

    // 3. Langsung return ke User tanpa nunggu email terkirim
    return { orderId: order.id, status: "PROCESSED" };
  }
}
module.exports = CreateOrderService;
