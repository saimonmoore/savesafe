import {
  CreateWebWorkerMLCEngine,
  CreateServiceWorkerMLCEngine,
  MLCEngineInterface,
  InitProgressReport,
  ChatCompletionMessageParam,
  ChatCompletion,
  ResponseFormat
} from "@mlc-ai/web-llm";

interface LLMResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

interface LLMClient {
  generateResponse(messages: { role: string, content: string }[]): Promise<LLMResponse>;
}

interface LLMlifecycle {
  onModelLoading: (progress: number, text?: string) => void;
  onModelReady: () => void;
  onModelError: (error: Error) => void;
}

class WebLLMManager implements LLMClient {
  private static instance: WebLLMManager;
  private engine: MLCEngineInterface | null = null;
  public selectedModel: string = "Qwen2.5-7B-Instruct-q4f32_1-MLC";
  // public selectedModel: string = "Llama-3.1-8B-Instruct-q4f32_1-MLC";
  private lifecycleCallback: LLMlifecycle | null = null;
  private worker: Worker | ServiceWorker | null = null;
  private ready: boolean = false;

  private constructor() { }

  public static getInstance(): WebLLMManager {
    if (!WebLLMManager.instance) {
      WebLLMManager.instance = new WebLLMManager();
    }
    return WebLLMManager.instance;
  }

  public async initializeEngine(
    lifecycleCallback?: LLMlifecycle,
    // forceServiceWorker: boolean = false
  ): Promise<void> {
    this.lifecycleCallback = lifecycleCallback ?? null;

    try {
      // First, check if service worker is supported and desired
      // if ("serviceWorker" in navigator && (forceServiceWorker || !navigator.onLine)) {
      //   await this.initServiceWorkerEngine();
      // } else {
      //   await this.initWebWorkerEngine();
      // }

      await this.initWebWorkerEngine();
    } catch (error) {
      console.error("Engine Initialization Error:", error);
      this.handleEngineInitError(error as Error);
    }
  }

  private async initWebWorkerEngine(): Promise<void> {
    this.lifecycleCallback?.onModelLoading(0, "Initializing Web Worker Engine");

    try {
      this.worker = new Worker(new URL("../shared-webllm-worker.ts", import.meta.url), { type: "module", name: "WebLLMWorker" });

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

  private async initServiceWorkerEngine(): Promise<void> {
    this.lifecycleCallback?.onModelLoading(0);

    try {
      // Register service worker
      const registration = await navigator.serviceWorker.register(
        new URL("../webllm-service-worker.ts", import.meta.url),
        { type: "module" }
      );

      if (registration.installing) {
        console.log("Service worker installing");
      } else if (registration.waiting) {
        console.log("Service worker installed");
      } else if (registration.active) {
        console.log("Service worker active");
      }

      this.engine = await CreateServiceWorkerMLCEngine(
        this.selectedModel,
        {
          initProgressCallback: this.handleInitProgress.bind(this),
        }
      );

      this.worker = registration.active;
    } catch (error) {
      throw new Error(`Service Worker initialization failed: ${error}`);
    }
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
    console.error("Engine Initialization Error:", error);
    this.lifecycleCallback?.onModelError(error);
  }

  public async generateResponse(messages: ChatCompletionMessageParam[]): Promise<ChatCompletion> {
    if (!this.engine) {
      throw new Error("Engine not initialized. Call initializeEngine first.");
    }

    if (!this.ready) {
      throw new Error("Engine not ready. Wait for onModelReady callback.");
    }

    try {
      const response = await Promise.race([
        this.engine.chat.completions.create({ messages, response_format: { type: "json_object" } as ResponseFormat },),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Request timed out")), 60000)
        )
      ]);

      return response as ChatCompletion;
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
export interface LLMResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}export interface LLMClient {
  generateResponse(messages: { role: string; content: string; }[]): Promise<LLMResponse>;
}

