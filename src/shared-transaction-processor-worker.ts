import { TransactionParser } from "@/lib/TransactionParser/TransactionParser";
import { MessageChannelConnectPayload, MessageChannelEvents, UploadEventPayload, UploadEvents } from "@/lib/Event";
import { WorkerLLMManager } from "@/lib/LLM/WorkerLLMManager";

type TransactionProcessorEvent = UploadEventPayload | MessageChannelConnectPayload;

class TransactionProcessorWorker {
  private handler?: TransactionParser;

  constructor() {
    this.setupMessageHandling();
  }

  private setupMessageHandling() {
    self.onmessage = (msg: MessageEvent<TransactionProcessorEvent>) => {
      if (msg.data.type === MessageChannelEvents.Connect) {
        this.handlePortConnection(msg.data.port);
      } else if (msg.data.type === UploadEvents.UploadFiles) {
        this.handler?.handleWorkerMessage(msg as MessageEvent<UploadEventPayload>);
      }
      else {
        throw new Error(`Unknown message type: ${msg.type}`);
      }
    };

    self.onerror = (error: string | Event) => {
      console.error("[TransactionProcessorWorker] Unhandled Error:", error);
    };
  }

  private handlePortConnection(port: MessagePort) {
    // Initialize the LLM Worker Coordinator
    // Within the worker context, there will be a single instance of the LLM Manager
    // with the port set.
    WorkerLLMManager.getInstance(port);

    this.handler = new TransactionParser();
  }
}

new TransactionProcessorWorker();