import { LLMEvents, LLMMessageEventPayload } from "@/lib/Event";
import { TransactionParserError } from "@/lib/TransactionParser/errors";

export interface LLMResponse {
  requestId: string;
  choices: {
    message: {
      content: string;
    };
  }[];
}

export type LLMChatMessage = { role: string; content: string };

// This class is designed to be used in a worker thread.
export class WorkerLLMManager {
  private static instance: WorkerLLMManager;
  private llmPort: MessagePort | null = null;

  public worker: Worker | ServiceWorker | null = null;

  private constructor(llmPort?: MessagePort) {
    if (llmPort) {
      this.llmPort = llmPort;
    }
  }

  public static getInstance(llmPort?: MessagePort): WorkerLLMManager {
    if (!WorkerLLMManager.instance) {
      WorkerLLMManager.instance = new WorkerLLMManager(llmPort);
    }
    return WorkerLLMManager.instance;
  }

  public async requestInference(
    messages: LLMChatMessage[]
  ): Promise<LLMResponse> {
    if (!this.llmPort) {
      throw new Error("[WorkerLLMManager] LLM port not set");
    }

    return Promise.race<LLMResponse>([
      new Promise<LLMResponse>((resolve, reject) => {
        const requestId = crypto.randomUUID();

        // Setup one-time response handler
        const responseHandler = (event: MessageEvent) => {
          if (
            event.data.type === LLMEvents.LLMResponse &&
            event.data.response.requestId === requestId
          ) {
            if (this.llmPort) {
              this.llmPort.onmessage = null;
              this.llmPort.onmessageerror = null;
            }

            try {
              const aiContent = JSON.parse(
                event.data.response.choices[0].message.content
              );

              if ("error" in aiContent) {
                reject(new TransactionParserError(aiContent.error));
              } else {
                // Ensure aiContent is of type LLMResponse
                const response: LLMResponse = {
                  requestId: requestId,
                  choices: event.data.response.choices,
                };
                resolve(response);
              }
            } catch (error) {
              console.error(
                "[WorkerLLMManager#requestInference responseHandler] Error parsing LLMResponse: ",
                { error }
              );
              reject(error);
            }
          }
        };

        if (this.llmPort) {
          this.llmPort.onmessage = responseHandler;
          this.llmPort.onmessageerror = (error) => {
            reject(error);
          };
        }

        const request: LLMMessageEventPayload = {
          requestId,
          type: LLMEvents.LLMMessage,
          messages,
        };

        this.llmPort?.postMessage(request);
      }),
      new Promise((_, reject) =>
        setTimeout(
          () =>
            reject(new Error("[WorkerLLMManager] Inference request timed out")),
          60000
        )
      ),
    ]);
  }
}
