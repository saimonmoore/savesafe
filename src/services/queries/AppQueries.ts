import { appTable } from "@/db/schemas/App";
import { singleResult } from "@/lib/utils";
import { Pglite } from "@/services/pglite";
import { ReadApiError } from "@/services/readApi";

export const AppQueries = function* () {
  const { query } = yield* Pglite;

  return {
    getSystem: query((_) => _.select().from(appTable)).pipe(
      singleResult(() => new ReadApiError({ cause: "System not found" }))
    ),
  };
};
