import { ConfigProvider, Layer, ManagedRuntime } from "effect";
import { Migrations } from "./migrations";
import { Pglite } from "@/services/pglite";
import { ReadApi } from "@/services/readApi";
import { WriteApi } from "@/services/writeApi";
import { AIClient } from "@/services/aiClient";
import { TransactionsApi } from "./transactionsApi";

const CustomConfigProvider = Layer.setConfigProvider(
  ConfigProvider.fromMap(
    new Map([
      ["INDEX_DB", "v1"],
      ["LLM_API_URL", ""],
      ["LLM_API_KEY", ""],
    ])
  )
);

const MainLayer = Layer.mergeAll(
  WriteApi.Default,
  ReadApi.Default,
  Migrations.Default,
  Pglite.Default,
  AIClient.Default,
  TransactionsApi.Default
).pipe(Layer.provide(CustomConfigProvider));

export const RuntimeClient = ManagedRuntime.make(MainLayer);
