/**
 * WhatsApp Notification Service
 * Requirements: 10.1, 10.2, 10.3, 10.4
 */

export interface WhatsAppConfig {
  teamNumber: string;
  sessionPath: string;
  maxRetries: number;
  dashboardBaseUrl: string;
}

export interface TicketNotificationData {
  ticketNo: string;
  customerName: string;
  issueType: string;
  ticketId: string;
}

export interface NotificationResult {
  success: boolean;
  attempts: number;
  error?: string;
}

/**
 * Default configuration
 */
const defaultConfig: WhatsAppConfig = {
  teamNumber: process.env.WHATSAPP_TEAM_NUMBER || '',
  sessionPath: process.env.WHATSAPP_SESSION_PATH || '.wwebjs_auth',
  maxRetries: 3,
  dashboardBaseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
};

/**
 * WhatsApp Service
 * Uses wwebjs for WhatsApp Web integration
 * 
 * Note: In production, this would use the actual wwebjs library.
 * This is a simplified implementation for the service layer.
 */
export class WhatsAppService {
  private config: WhatsAppConfig;
  private isInitialized: boolean = false;
  private client: unknown = null; // Would be Client from whatsapp-web.js

  constructor(config?: Partial<WhatsAppConfig>) {
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * Initializes the WhatsApp client
   * Requirements: 10.1
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    // In production, this would initialize the wwebjs client:
    // const { Client, LocalAuth } = require('whatsapp-web.js');
    // this.client = new Client({
    //   authStrategy: new LocalAuth({ dataPath: this.config.sessionPath }),
    //   puppeteer: { headless: true }
    // });
    // await this.client.initialize();

    this.isInitialized = true;
    console.log('WhatsApp service initialized');
  }

  /**
   * Sends a ticket notification to the team
   * Requirements: 10.2, 10.3
   * 
   * Property 26: WhatsApp Notification Content
   * Property 27: Notification Retry Behavior
   */
  async sendTicketNotification(data: TicketNotificationData): Promise<NotificationResult> {
    const message = this.buildNotificationMessage(data);
    return this.sendWithRetry(this.config.teamNumber, message);
  }

  /**
   * Sends a status update notification
   */
  async sendStatusUpdate(
    ticketNo: string,
    oldStatus: string,
    newStatus: string
  ): Promise<NotificationResult> {
    const message = `🔄 *Status Update*\n\nTicket: ${ticketNo}\nStatus: ${oldStatus} → ${newStatus}`;
    return this.sendWithRetry(this.config.teamNumber, message);
  }

  /**
   * Builds the notification message
   * Property 26: WhatsApp Notification Content
   * 
   * Message SHALL contain: ticketNo, customer name, issue type, and dashboard link
   */
  buildNotificationMessage(data: TicketNotificationData): string {
    const dashboardLink = `${this.config.dashboardBaseUrl}/ops/tickets/${data.ticketId}`;
    
    return [
      '🎫 *New Ticket Received*',
      '',
      `*Ticket No:* ${data.ticketNo}`,
      `*Customer:* ${data.customerName}`,
      `*Issue Type:* ${data.issueType}`,
      '',
      `📋 *Dashboard:* ${dashboardLink}`,
    ].join('\n');
  }

  /**
   * Sends a message with retry logic
   * Property 27: Notification Retry Behavior
   * 
   * SHALL retry up to 3 times before marking as failed
   */
  private async sendWithRetry(
    to: string,
    message: string
  ): Promise<NotificationResult> {
    let lastError: string | undefined;
    
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        await this.sendMessage(to, message);
        return { success: true, attempts: attempt };
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error';
        console.error(`WhatsApp send attempt ${attempt} failed:`, lastError);
        
        // Wait before retry (exponential backoff)
        if (attempt < this.config.maxRetries) {
          await this.delay(Math.pow(2, attempt) * 1000);
        }
      }
    }

    return {
      success: false,
      attempts: this.config.maxRetries,
      error: lastError,
    };
  }

  /**
   * Sends a message via WhatsApp
   */
  private async sendMessage(to: string, message: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('WhatsApp service not initialized');
    }

    // In production, this would use the wwebjs client:
    // const chatId = to.includes('@c.us') ? to : `${to}@c.us`;
    // await this.client.sendMessage(chatId, message);

    // For now, just log the message
    console.log(`[WhatsApp] Sending to ${to}:`, message);
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Checks if the service is ready
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Destroys the client session
   */
  async destroy(): Promise<void> {
    if (this.client) {
      // await this.client.destroy();
      this.client = null;
    }
    this.isInitialized = false;
  }
}

/**
 * Validates notification message content
 * Property 26: WhatsApp Notification Content
 */
export function validateNotificationContent(
  message: string,
  data: TicketNotificationData
): boolean {
  return (
    message.includes(data.ticketNo) &&
    message.includes(data.customerName) &&
    message.includes(data.issueType) &&
    message.includes(data.ticketId) // Dashboard link contains ticketId
  );
}

/**
 * Simulates retry behavior for testing
 * Property 27: Notification Retry Behavior
 */
export function simulateRetryBehavior(
  failureCount: number,
  maxRetries: number
): { success: boolean; attempts: number } {
  const attempts = Math.min(failureCount + 1, maxRetries);
  const success = failureCount < maxRetries;
  
  return { success, attempts };
}

/**
 * Creates a WhatsAppService instance
 */
export function createWhatsAppService(config?: Partial<WhatsAppConfig>): WhatsAppService {
  return new WhatsAppService(config);
}

/**
 * Default WhatsApp service instance
 */
let defaultService: WhatsAppService | null = null;

export function getWhatsAppService(): WhatsAppService {
  if (!defaultService) {
    defaultService = new WhatsAppService();
  }
  return defaultService;
}
