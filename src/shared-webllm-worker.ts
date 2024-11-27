import { WebWorkerMLCEngineHandler } from "@mlc-ai/web-llm";

// Web Worker Handler
const handler = new WebWorkerMLCEngineHandler();

// Standard Web Worker Communication
self.onmessage = (msg: MessageEvent) => {
  console.log("Web Worker Message:", msg);

  try {
    handler.onmessage(msg);
  } catch (error) {
    console.error("Web Worker Message Handling Error:", error);
    // self.postMessage({
    //   type: 'error',
    //   error: {
    //     message: (error as Error).message,
    //     stack: (error as Error).stack
    //   }
    // });
  }
};

// Optional: Error Handling
self.onerror = (error: string | Event) => {
  console.error("Web Worker Unhandled Error:", error);
//   self.postMessage({
//     type: 'shared-worker-error',
//     error 
//   });
};