/**
 * AggregateRoot
 *
 * Base class for all aggregate roots in the domain layer.
 *
 * An aggregate root is the top-level entity in a cluster of related objects.
 * It's responsible for:
 * - Maintaining consistency within its aggregate
 * - Recording domain events
 * - Exposing only the aggregate root for external access
 *
 * Domain Events allow decoupled communication between aggregates.
 * Example: Order aggregate emits "OrderCreated" event, which triggers
 * email sending in another bounded context without tight coupling.
 *
 * @abstract
 * @example
 * class Order extends AggregateRoot {
 *   constructor(id, customerId, items) {
 *     super();
 *     this.id = id;
 *     this.customerId = customerId;
 *     this.items = items;
 *
 *     // Record what happened
 *     this.addDomainEvent({ type: 'OrderCreated', orderId: id });
 *   }
 *
 *   pay(amount) {
 *     if (this.status !== 'PENDING') throw new Error('Invalid state');
 *     this.status = 'PAID';
 *     this.addDomainEvent({ type: 'OrderPaid', orderId: this.id });
 *   }
 * }
 */
class AggregateRoot {
  /**
   * Initialize aggregate root with empty domain events array
   */
  constructor() {
    this._domainEvents = [];
  }

  /**
   * Add a domain event to the event queue
   *
   * Domain events represent something important that happened in the business.
   * They're recorded on the aggregate and can be published to other contexts.
   *
   * Timestamp is automatically added to track when the event occurred.
   *
   * @param {Object} event - The domain event object
   * @param {string} event.type - Event type (e.g., 'OrderCreated', 'PaymentProcessed')
   * @param {*} event.data - Event payload (specific to each event)
   *
   * @returns {void}
   *
   * @example
   * this.addDomainEvent({
   *   type: 'OrderCreated',
   *   orderId: this.id,
   *   customerId: this.customerId,
   *   total: this.getTotal()
   * });
   */
  addDomainEvent(event) {
    // Automatically add timestamp to track when event occurred
    const eventWithDate = {
      occurredOn: new Date(),
      ...event,
    };
    this._domainEvents.push(eventWithDate);
  }

  /**
   * Get all domain events recorded on this aggregate
   *
   * Called by the application service after persisting the aggregate
   * to publish events to other contexts (email, notifications, etc.)
   *
   * @returns {Array} Array of domain events with timestamps
   *
   * @example
   * const order = await orderRepository.save(order);
   * for (const event of order.domainEvents) {
   *   await eventBus.publish(event);
   * }
   */
  get domainEvents() {
    return this._domainEvents;
  }

  /**
   * Clear all domain events after they've been published
   *
   * Called after domain events are successfully published to prevent
   * duplicate processing if the aggregate is fetched again.
   *
   * @returns {void}
   *
   * @example
   * // After publishing events
   * order.clearEvents();
   * // Now order.domainEvents will be empty []
   */
  clearEvents() {
    this._domainEvents = [];
  }
}

module.exports = AggregateRoot;
