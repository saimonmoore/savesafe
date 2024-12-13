import { LLMChatMessage } from "@/lib/LLM/types";
import { Effect, Config, Data } from "effect";

class AIClientError extends Data.TaggedError("AIClientError")<{
  cause: unknown;
}> {}

const LLM_API_MODELS = {
    "QWEN2572b": "qwen2.5-72b-instruct",
    "gpt4oMini": "gpt-4o-mini"
}

export class AIClient extends Effect.Service<AIClient>()("AIClient", {
  effect: Effect.gen(function* () {
    const apiUrl = yield* Config.string("LLM_API_URL");
    const apiKey = yield* Config.string("LLM_API_KEY");

    const requestInference = (messages: LLMChatMessage[]) =>
      Effect.tryPromise({
        try: async () => {
          const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${apiKey}`,
            },
            body: JSON.stringify({ messages, model: LLM_API_MODELS.QWEN2572b }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new AIClientError({ cause: errorData });
          }

          return response.json();
        },
        catch: (error) => new AIClientError({ cause: error }),
      });

    return { requestInference };
  }),
  dependencies: [],
}) {}


