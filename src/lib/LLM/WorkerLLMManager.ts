import { LLMEvents, LLMMessageEventPayload } from "@/lib/Event";
import { TransactionParserError } from "@/lib/TransactionParser/errors";
import { LLMChatMessage, LLMResponse, LLMWorkerClient } from "./types";

// This class is designed to be used in a worker thread.
export class WorkerLLMManager implements LLMWorkerClient {
  private static MAX_INFERENCE_TIME = 200000;
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

    const requestId = crypto.randomUUID();
    const abortController = new AbortController();

    const inferencePromise = new Promise<LLMResponse>((resolve, reject) => {

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
              console.log('[WorkerLLMManager#requestInference responseHandler] ==============> error: ', { requestId, aiContent });
              reject(new TransactionParserError(aiContent.error));
            } else {
              // Ensure aiContent is of type LLMResponse
              const response: LLMResponse = {
                requestId: requestId,
                choices: event.data.response.choices,
              };
              console.log('[WorkerLLMManager#requestInference responseHandler] ==============> response: ', { requestId, response });
              resolve(response);
            }
          } catch (error) {
            console.error(
              "[WorkerLLMManager#requestInference responseHandler] Error parsing LLMResponse: ",
              { requestId, error }
            );
            reject(error);
          }
        }
      };

      if (this.llmPort) {
        this.llmPort.onmessage = responseHandler;
        this.llmPort.onmessageerror = (error) => {
          console.log('[WorkerLLMManager#requestInference] ==============> error: ', { requestId, error }); 
          reject(error);
        };
      }

      const request: LLMMessageEventPayload = {
        requestId,
        type: LLMEvents.LLMMessage,
        messages,
      };

      console.log('[WorkerLLMManager#requestInference] ==============> request: ', { requestId, request });
      this.llmPort?.postMessage(request);
    });

    const timeoutPromise = new Promise<never>((_, reject) => {
      const timeoutId = setTimeout(() => {
        console.log('[WorkerLLMManager#requestInference] ==============> TIMEOUT: ', { requestId, timeoutId });
        reject(new Error("[WorkerLLMManager] Inference request timed out"));
      }, WorkerLLMManager.MAX_INFERENCE_TIME);

      abortController.signal.addEventListener("abort", () => {
        console.log('[WorkerLLMManager#requestInference] ==============> abort: ', { requestId, timeoutId });
        clearTimeout(timeoutId);
      });
    });

    const result = await Promise.race([inferencePromise, timeoutPromise]);
    console.log('[WorkerLLMManager#requestInference] ==============> race result: ', { requestId, result });
    abortController.abort(); // Cancel the timeout if inference completes

    return result;
  }
}
