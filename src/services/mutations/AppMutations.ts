import { Schema } from "effect";
import { appTable } from "@/db/schemas/App";
import { singleResult } from "@/lib/utils";
import { execute, WriteApiError } from "@/services/writeApi";
import { Pglite } from "@/services/pglite";

export const AppMutations = function* () {
  const { query } = yield* Pglite;

  return {
    createApp: query((_) =>
      _.insert(appTable).values({ version: 0 }).returning()
    ).pipe(singleResult(() => new WriteApiError({ cause: "App not created" }))),

    updateSystemVersion: execute(Schema.Positive, (version) =>
      // Single row or multiple?
      query((_) => _.update(appTable).set({ version }))
    ),
  };
};
