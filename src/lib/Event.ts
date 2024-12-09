import { Transaction } from "@/domain/models/Transaction/Transaction";
import { LLMChatMessage } from "./LLM/types";
import { LLMResponse } from "./LLM/types";

export enum TransactionEvents {
    TransactionsParsed = "TransactionsParsedEvent",
    TransactionParsingError = "TransactionParsingErrorEvent",
    TransactionsCategorized = "TransactionsCategorizedEvent"
}

export enum UploadEvents {
    UploadFiles = "UploadFilesEvent"
}

export enum LLMEvents {
    LLMMessage = "LLMMessageEvent",
    LLMResponse = "LLMResponseEvent"
}

export enum MessageChannelEvents {
    Connect = "connect"
}

type LLMRequest = { requestId: string };

export type UploadEventPayload = { type: UploadEvents.UploadFiles, files: File[] };
export type LLMMessageEventPayload = LLMRequest & { type: LLMEvents.LLMMessage, messages: LLMChatMessage[] };
export type LLMResponseEventPayload = LLMRequest & { type: LLMEvents.LLMResponse, response: LLMResponse };
export type TransactionsParsedPayload = { type: TransactionEvents.TransactionsParsed, transactions: Transaction[] };
export type TransactionsCategorizedPayload = { type: TransactionEvents.TransactionsCategorized, transactions: Transaction[] };
export type TransactionParsingErrorPayload = { type: TransactionEvents.TransactionParsingError, error: Error };
export type TransactionProcessorEvent = TransactionsParsedPayload | TransactionsCategorizedPayload;

export type MessageChannelConnectPayload = { type: MessageChannelEvents.Connect, port: MessagePort, payload: UploadEventPayload | LLMMessageEventPayload };

export class EventManager {
    public static uploadFilesEvent(files: File[]): UploadEventPayload {
        return { type: UploadEvents.UploadFiles, files };
    }

    public static transactionsParsedEvent(transactions: Transaction[]): TransactionsParsedPayload {
        return { type: TransactionEvents.TransactionsParsed, transactions };
    }

    public static transactionsCategorizedEvent(transactions: Transaction[]): TransactionsCategorizedPayload {
        return { type: TransactionEvents.TransactionsCategorized, transactions };
    }

    public static transactionParsingErrorEvent(error: Error): TransactionParsingErrorPayload {
        return { type: TransactionEvents.TransactionParsingError, error };
    }

    public static llmMessageEvent(messages: LLMChatMessage[]): LLMMessageEventPayload {
        return { type: LLMEvents.LLMMessage, messages };
    }

    public static llmResponseEvent(response: LLMResponse): LLMResponseEventPayload {
        return { type: LLMEvents.LLMResponse, response };
    }

    public static messageChannelConnectEvent(port: MessagePort, payload: UploadEventPayload | LLMMessageEventPayload): MessageChannelConnectPayload {
        return { type: MessageChannelEvents.Connect, port, payload };
    }
}

export class EventEmitter extends EventTarget {
    private static instance: EventEmitter;
    private subscribers: Map<string, EventListener> = new Map()

    private constructor(subscribers?: Map<string, EventListener>) {
        super();
        this.subscribers = subscribers || new Map();

        this.subscribers.forEach((listener, eventType) => {
            this.addSubscriber(eventType, listener);
        });
    }

    public static getInstance(subscribers?: Map<string, EventListener>): EventEmitter {
        if (!this.instance) {
            this.instance = new EventEmitter(subscribers);
        }
        return this.instance;
    }

    public addSubscriber(eventType: string, listener: EventListener): void {
        this.subscribers.set(eventType, listener);
        this.addEventListener(eventType, listener);
    }

    public removeSubscriber(eventType: string): void {
        const listener = this.subscribers.get(eventType);
        if (listener) {
            this.removeEventListener(eventType, listener);
            this.subscribers.delete(eventType);
        }
    }
}
