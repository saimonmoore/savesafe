import { pgSchema } from "drizzle-orm/pg-core";
import { dbSchemaName } from "@/config";

export const dbSchema = pgSchema(dbSchemaName);
