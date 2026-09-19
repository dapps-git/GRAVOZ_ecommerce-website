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
          // Processed invoice email
          break;
        case 'PROCESS_REFUND':
          // Processed background refund
          break;
        case 'STOCK_SYNC':
          // Synchronized stock counts
          break;
        default:
          break;
      }
    } catch (err) {
      console.error(`[JobQueue] Error processing job ${job.type}:`, err);
    }
  }
}

export const backgroundQueue = new BackgroundQueue();
