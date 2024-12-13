import {
  CreateWebWorkerMLCEngine,
  MLCEngineInterface,
  InitProgressReport,
  ChatCompletionMessageParam,
  ResponseFormat
} from "@mlc-ai/web-llm";
import { LLMEvents, LLMMessageEventPayload, LLMResponseEventPayload, MessageChannelEvents } from "@/lib/Event";
import { LLMChatMessage, LLMClient, LLMResponse } from "./types";
import { SUPPORTED_MODELS } from "@/config";

interface LLMlifecycle {
  onModelLoading: (progress: number, text?: string) => void;
  onModelReady: () => void;
  onModelError: (error: Error) => void;
}


// This class is designed to be used in the main thread.
export class WebLLMManager implements LLMClient {
  private static instance: WebLLMManager;
  private engine: MLCEngineInterface | null = null;
  public selectedModel: string = SUPPORTED_MODELS.QWEN257b;
  private lifecycleCallback: LLMlifecycle | null = null;
  public worker: Worker | ServiceWorker | null = null;
  private connectedPorts: Set<MessagePort> = new Set();
  private pendingRequests: Map<string, (response: LLMResponse) => void> = new Map();
  private ready: boolean = false;

  public constructor(engine?: MLCEngineInterface) {
    if (engine) {
      this.engine = engine;
    }
  }

  public static getInstance(): WebLLMManager {
    if (!WebLLMManager.instance) {
      WebLLMManager.instance = new WebLLMManager();
    }
    return WebLLMManager.instance;
  }

  public async initializeEngine(
    lifecycleCallback?: LLMlifecycle,
  ): Promise<void> {
    this.lifecycleCallback = lifecycleCallback ?? null;

    try {
      await this.initWebWorkerEngine();
    } catch (error) {
      this.handleEngineInitError(error as Error);
    }
  }

  private async initWebWorkerEngine(): Promise<void> {
    this.lifecycleCallback?.onModelLoading(0, "Initializing Web Worker Engine");

    try {
      this.worker = new Worker(new URL("../../shared-webllm-worker.ts", import.meta.url), { type: "module", name: "WebLLMWorker" });
      this.worker.onmessage = (event: MessageEvent<LLMResponseEventPayload>) => {
        if (event.data.type === LLMEvents.LLMResponse) {
          const response = event.data.response;
          // Broadcast response to all connected ports
          this.connectedPorts.forEach(port => {
            port.postMessage(event.data);
          });
  
          // Handle main thread requests
          const resolver = this.pendingRequests.get(response.requestId);
          if (resolver) {
            resolver(response);
            this.pendingRequests.delete(response.requestId);
          }
        }
      };

      this.engine = await CreateWebWorkerMLCEngine(
        this.worker,
        this.selectedModel,
        {
          initProgressCallback: this.handleInitProgress.bind(this)
        }
      );

    } catch (error) {
      throw new Error(`Web Worker initialization failed: ${error}`);
    }
  }

  public connectWorker(otherWorker: Worker): void {
    const channel = new MessageChannel();
    
    // Connect the worker to the LLM worker via the main thread
    if (this.worker) {
      this.worker.postMessage({ type: MessageChannelEvents.Connect, port: channel.port1 }, [channel.port1]);
      otherWorker.postMessage({ type: MessageChannelEvents.Connect, port: channel.port2 }, [channel.port2]);
    }
    
    // Keep track of the port for broadcasting responses
    this.connectedPorts.add(channel.port2);
    
    // Setup port message handling
    channel.port2.onmessage = (event: MessageEvent<LLMMessageEventPayload>) => {
      if (event.data.type === LLMEvents.LLMMessage) {
        // Forward request to LLM worker
        if (this.worker) {
          this.worker.postMessage(event.data);
        }
      }
    };
  }

  public async requestInference(messages: Array<{ role: string; content: string }>): Promise<LLMResponse> {
    return new Promise((resolve) => {
      const requestId = crypto.randomUUID();
      this.pendingRequests.set(requestId, resolve);

      const request: LLMMessageEventPayload = {
        requestId,
        type: LLMEvents.LLMMessage,
        messages
      };

      if (this.worker) {
        this.worker.postMessage(request);
      }
    });
  }

  private extractLoadingFromCacheProgress(input: string): number | null {
    const match = input.match(/\[(\d+)\/(\d+)\]/);
    if (match) {
      const [, loaded, total] = match.map(Number);
      return (loaded / total);
    }
    return null; // Return null if the pattern doesn't match
  }

  private handleInitProgress(report: InitProgressReport): void {
    if (report.progress === 1) {
      this.lifecycleCallback?.onModelReady();
      this.ready = true;
    } else {
      if (report.text.match(/Loading model from cache/)) {
        const progress = this.extractLoadingFromCacheProgress(report.text) || report.progress;
        this.lifecycleCallback?.onModelLoading(progress, report.text);
      } else {
        this.lifecycleCallback?.onModelLoading(report.progress, report.text);
      }
    }
  }

  private handleEngineInitError(error: Error): void {
    this.lifecycleCallback?.onModelError(error);
  }

  public async generateResponse(messages: LLMChatMessage[]): Promise<LLMResponse> {
    if (!this.engine) {
      throw new Error("Engine not initialized. Call initializeEngine first.");
    }

    if (!this.ready) {
      throw new Error("Engine not ready. Wait for onModelReady callback.");
    }

    try {
      const response = await Promise.race([
        this.engine.chat.completions.create({ messages: messages as ChatCompletionMessageParam[], response_format: { type: "json_object" } as ResponseFormat },),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Request timed out")), 60000)
        )
      ]);

      return response as LLMResponse;
    } catch (error) {
      console.error("Generation Error:", error);
      throw error;
    }
  }

  // Optional: Cleanup method
  public async cleanup(): Promise<void> {
    if (this.worker instanceof Worker) {
      this.worker.terminate();
    } else if (this.worker && 'active' in this.worker) {
      await navigator.serviceWorker.ready;
      this.worker = null;
    }
    this.engine = null;
  }
}

// Singleton export for easy usage
export const WebLLM = WebLLMManager.getInstance();