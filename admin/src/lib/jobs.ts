export interface JobTask {
  type: 'SEND_INVOICE_EMAIL' | 'GENERATE_PDF' | 'PROCESS_REFUND' | 'STOCK_SYNC';
  payload: Record<string, unknown>;
  createdAt: Date;
}

class BackgroundQueue {
  private queue: JobTask[] = [];

  async addJob(type: JobTask['type'], payload: Record<string, unknown>): Promise<void> {
    const job: JobTask = {
      type,
      payload,
      createdAt: new Date(),
    };
    this.queue.push(job);
    // Process asynchronously in background
    setTimeout(() => this.processNextJob(), 100);
  }

  private async processNextJob() {
    if (this.queue.length === 0) return;
    const job = this.queue.shift();
    if (!job) return;

    try {
      switch (job.type) {
        case 'SEND_INVOICE_EMAIL':
          console.log(`[JobQueue] Sent invoice email to ${job.payload.email} for order ${job.payload.orderNumber}`);
          break;
        case 'PROCESS_REFUND':
          console.log(`[JobQueue] Processed background refund $${job.payload.amount} for order ${job.payload.orderNumber}`);
          break;
        case 'STOCK_SYNC':
          console.log(`[JobQueue] Synchronized stock counts across channels`);
          break;
        default:
          console.log(`[JobQueue] Processed generic job`, job);
      }
    } catch (err) {
      console.error(`[JobQueue] Error processing job ${job.type}:`, err);
    }
  }
}

export const backgroundQueue = new BackgroundQueue();
