import { timestamps } from "./column.helpers";
import { dbSchema } from "./schema";
import * as t from "drizzle-orm/pg-core";

export enum Category {
    Housing = "housing",
    Utilities = "utilities",
    Food = "food",
    Transport = "transport",
    Technology = "technology",
    Entertainment = "entertainment",
    Finance = "finance",
    Education = "education",
    Healthcare = "healthcare",
    Shopping = "shopping",
    Telecommunications = "telecommunications",
    Other = "other"
}

export const categoriesEnum = dbSchema.enum(
  "category",
  Object.values(Category) as [string, ...string[]]
);

export const categoryTable = dbSchema.table(
  "categories",
  {
    id: t.integer().primaryKey().generatedAlwaysAsIdentity(),
    category: categoriesEnum().notNull(),
    ...timestamps,
  },
  (table) => [
    t.index("categories_category_idx").on(table.category),
  ]
);