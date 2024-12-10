import { ConfigProvider, Layer, ManagedRuntime } from "effect";
import { Migrations } from "./migrations";
import { Pglite } from "@/services/pglite";
import { ReadApi } from "@/services/readApi";
import { WriteApi } from "@/services/writeApi";

const CustomConfigProvider = Layer.setConfigProvider(
  ConfigProvider.fromMap(new Map([["INDEX_DB", "v1"]]))
);

const MainLayer = Layer.mergeAll(
  WriteApi.Default,
  ReadApi.Default,
  Migrations.Default,
  Pglite.Default
).pipe(Layer.provide(CustomConfigProvider));

export const RuntimeClient = ManagedRuntime.make(MainLayer);