import { LLMChatMessage, LLMResponse } from "./types";

export interface LLMResponse {
  requestId: string;
  choices: {
    message: {
      content: string;
    };
  }[];
}

export type LLMChatMessage = { role: string; content: string; };

export interface LLMResponse {
  requestId: string;
  choices: {
    message: {
      content: string;
    };
  }[];
}

export interface LLMClient {
  generateResponse(messages: LLMChatMessage[]): Promise<LLMResponse>;
}

export interface LLMWorkerClient {
  requestInference(messages: LLMChatMessage[]): Promise<LLMResponse>;
}

