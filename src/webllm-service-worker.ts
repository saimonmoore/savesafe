/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope;

import { ServiceWorkerMLCEngineHandler } from "@mlc-ai/web-llm";

// interface ServiceWorkerMessage {
//     type: string;
//     data?: any;
//   }

// eslint-disable-next-line @typescript-eslint/no-unused-vars
let handler: ServiceWorkerMLCEngineHandler;

// Service Worker Lifecycle Events
self.addEventListener("install", (event: ExtendableEvent) => {
  console.log("Service Worker installing");
  event.waitUntil(self.skipWaiting());
});

// self.addEventListener("activate", (event: ExtendableEvent) => {
self.addEventListener("activate", () => {
  console.log("Service Worker activating");
//   event.waitUntil(self.clients.claim());
  
  handler = new ServiceWorkerMLCEngineHandler();
});

// // Standard Service Worker Communication
// self.addEventListener("message", (event: ExtendableMessageEvent) => {
//   try {
//     const message: ServiceWorkerMessage = event.data;

//     // Handle different message types
//     switch (message.type) {
//         case 'generate-text':
//           // Handle text generation request
//           handler.onmessage(event);
//           break;
//         // Add more message type handlers as needed
//         default:
//           console.warn(`Unhandled message type: ${message.type}`);
//       }
//   } catch (error) {
//     console.error("Service Worker Message Handling Error:", error);
//     event.ports[0]?.postMessage({
//       type: 'service-worker-error',
//       error: {
//         message: (error as Error).message,
//         stack: (error as Error).stack
//       }
//     });
//   }
// });

// Optional: Catch and report unhandled errors
self.addEventListener("error", (error) => {
  console.error("Service Worker Unhandled Error:", error);
});