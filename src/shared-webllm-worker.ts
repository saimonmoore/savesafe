import {
  ChatCompletion,
  ChatCompletionMessage,
  WebWorkerMLCEngineHandler,
} from "@mlc-ai/web-llm";
import { LLMResponse } from "@/lib/LLM/WebLLMManager";
import {
  EventManager,
  LLMEvents,
  LLMMessageEventPayload,
  LLMResponseEventPayload,
  MessageChannelEvents,
} from "@/lib/Event";

class LLMWorkerHandler {
  private mlcHandler: WebWorkerMLCEngineHandler;
  private ports: Set<MessagePort> = new Set();

  constructor() {
    this.mlcHandler = new WebWorkerMLCEngineHandler();
    this.setupMessageHandling();
  }

  private setupMessageHandling() {
    self.onmessage = (msg: MessageEvent) => {
      if (msg.data.type === MessageChannelEvents.Connect) {
        // Handle port messages
        this.handlePortConnection(msg.data.port);
      } else if (msg.data.type === LLMEvents.LLMMessage) {
        // Handle MLC-specific messages
        this.mlcHandler.engine.chat.completions
          .create({
            messages: msg.data.messages as ChatCompletionMessage[],
            response_format: { type: "json_object" },
          })
          .then((response: ChatCompletion) => {
            const inferenceResponse: LLMResponseEventPayload = {
              type: LLMEvents.LLMResponse,
              requestId: msg.data.requestId,
              response: {
                choices: response.choices as { message: { content: string } }[],
              } as LLMResponse,
            };
            self.postMessage(inferenceResponse);
          });
      } else {
        this.mlcHandler.onmessage(msg);
      }
    };

    self.onerror = (error: string | Event) => {
      console.error("LLMWebWorker Unhandled Error:", error);
    };
  }

  private handlePortConnection(port: MessagePort) {
    this.ports.add(port);
    port.onmessage = async (event: MessageEvent<LLMMessageEventPayload>) => {
      if (event.data.type === LLMEvents.LLMMessage) {
        const request = event.data as LLMMessageEventPayload;
        try {
          const response: ChatCompletion =
            await this.mlcHandler.engine.chat.completions.create({
              messages: request.messages as ChatCompletionMessage[],
              response_format: { type: "json_object" },
            });

          const inferenceResponse: LLMResponse = {
            requestId: request.requestId,
            choices: response.choices as { message: { content: string } }[],
          };

          port.postMessage(EventManager.llmResponseEvent(inferenceResponse));
        } catch (error) {
          console.error("[LLMWorker] Inference error:", error);
        }
      }
    };

    port.onmessageerror = (error) => {
      console.error("[LLMWorker] Port message error:", error);
    };
  }
}

new LLMWorkerHandler();
