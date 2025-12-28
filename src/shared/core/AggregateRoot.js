class AggregateRoot {
  constructor() {
    this._domainEvents = [];
  }

  /**
   * Menambahkan event ke antrian.
   * Contoh: this.addDomainEvent({ type: 'OrderCreated', orderId: this.id });
   */
  addDomainEvent(event) {
    // Tambahkan timestamp otomatis
    const eventWithDate = {
      occurredOn: new Date(),
      ...event,
    };
    this._domainEvents.push(eventWithDate);
  }

  /**
   * Mengambil semua event yang terjadi
   */
  get domainEvents() {
    return this._domainEvents;
  }

  /**
   * Membersihkan event setelah berhasil diproses/disimpan
   */
  clearEvents() {
    this._domainEvents = [];
  }
}

module.exports = AggregateRoot;
