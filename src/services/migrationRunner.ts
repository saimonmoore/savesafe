import { Effect } from "effect";
import { Migrations } from "@/services/migrations";
import { ReadApi } from "@/services/readApi";
import { WriteApi } from "@/services/writeApi";

export const runMigrations = Effect.gen(function* () {
  const migrations = yield* Migrations;
  const readApi = yield* ReadApi;
  const api = yield* WriteApi;

  const latestMigration = migrations.length;
  const { version } = yield* readApi.getSystem.pipe(
    Effect.catchTags({
      PgliteError: () => Effect.succeed({ version: 0 }), // No db yet
    })
  );

  // Make this step reversible, they must both complete, or none (`acquireRelease`)
  yield* Effect.all(migrations.slice(version));

  if (version === 0) {
    yield* api.createApp;
  }

  yield* api.updateAppVersion(latestMigration);

  yield* Effect.log(
    version === latestMigration
      ? "Database up to date"
      : `Migrations done (from ${version} to ${latestMigration})`
  );
}).pipe(Effect.tapErrorCause(Effect.logError));
