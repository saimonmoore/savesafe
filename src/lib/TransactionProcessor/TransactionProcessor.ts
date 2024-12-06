import { Transaction } from "@/domain/models/Transaction/Transaction";
import { EventManager, TransactionProcessorEvent, TransactionEvents, TransactionParsingErrorPayload } from "@/lib/Event";
import { WebLLMManager } from "@/lib/LLM/WebLLMManager";

type TransactionsProcessedCallback = (transactions: Transaction[]) => void;

export class TransactionProcessor {
    private static instance: TransactionProcessor;
    private llmManager: WebLLMManager;
    private worker: Worker;

    constructor() {
        this.llmManager = WebLLMManager.getInstance();
        this.worker = new Worker(new URL("../../shared-transaction-processor-worker.ts", import.meta.url), { type: "module", name: "TransactionProcessorWorker" });

        this.llmManager.connectWorker(this.worker);
    }

    public static getInstance(): TransactionProcessor {
        if (!this.instance) {
            this.instance = new TransactionProcessor();
        }
        return this.instance;
    }

    public process(files: File[], setTransactions: TransactionsProcessedCallback): void {
        // Send the files to the worker
        this.worker.postMessage(EventManager.uploadFilesEvent(files));

        // Receive the transactions from the worker
        this.worker.onmessage = (event: MessageEvent<TransactionProcessorEvent | TransactionParsingErrorPayload>) => {
            console.error("[TransactionsProcessor] Received event from worker", event.type, event.data);

            if (event.data.type === TransactionEvents.TransactionsParsed) {
                setTransactions(event.data.transactions);
            }

            if (event.data.type === TransactionEvents.TransactionParsingError) {
                console.error("[TransactionsProcessor] Worker Error parsing transations", event.data.error);
            }
        }

        // Handle errors from the worker
        this.worker.onerror = (error: ErrorEvent) => {
            console.error("[TransactionsProcessor] Worker Error ", error);
        }
    }
}