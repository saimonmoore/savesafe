import { timestamps } from "./column.helpers";
import { dbSchema } from "./schema";
import * as t from "drizzle-orm/pg-core";

// Core categories
// TODO: Allow for custom categories
export enum Category {
    // Housing & Utilities
    Housing = "housing",
    Utilities = "utilities", 

    // Transportation
    PublicTransport = "public transport", // bus, train, etc.
    Car = "car",
    Fuel = "fuel", 
    Parking = "parking",

    // Food & Dining
    Groceries = "groceries",
    EatingOut = "eating out",

    // Technology & Communications
    Telecommunications = "telecommunications", // internet, phone, etc.
    Internet= "internet", // domains, servers, etc.

    // Financial & Legal
    Finance = "finance",
    BankCosts = "bank costs",
    CommonAccount = "common account",
    Taxation = "taxation",
    Fines = "fines",

    // Education & Activities
    Education = "education",
    SchoolMaterial = "school material",
    ChildrensActivities = "children's activities",
    Activities = "activities",

    // Health & Wellness
    Healthcare = "healthcare",

    // Shopping & Lifestyle
    Shopping = "shopping",
    Entertainment = "entertainment",
    Holidays = "holidays",
    Gifts = "gifts",
    Subscriptions = "subscriptions",

    // Miscellaneous
    Miscellaneous = "miscellaneous"
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