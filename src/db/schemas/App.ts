import { dbSchema } from "./schema";
import * as t from "drizzle-orm/pg-core";

export const appTable = dbSchema.table("app", {
  version: t.integer().notNull().default(0),
});
