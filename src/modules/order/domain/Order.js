// const { AggregateRoot, AppError, Guard } = require("@shared/core");

// class Order extends AggregateRoot {
//   constructor(id, customerId, items) {
//     super(); // Init array event

//     // Pakai Guard untuk validasi defensif
//     Guard.againstNullOrUndefined(id, "Order ID is required");

//     if (items.length === 0) {
//       // Pakai AppError untuk error standar
//       throw new AppError("Items cannot be empty", 400);
//     }

//     this.id = id;
//     this.items = items;
//   }

//   pay() {
//     this.status = "PAID";
//     // Catat event
//     this.addDomainEvent({ type: "OrderPaid", orderId: this.id });
//   }
// }
// module.exports = Order;
