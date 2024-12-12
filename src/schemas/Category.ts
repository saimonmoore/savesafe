import { Schema } from "effect";
import { Category } from "@/db/schemas/Category";
import { PrimaryKeyIndex } from "./shared";

export const CategoryValue = Schema.Literal(
  ...Object.values(Category) as [Category, ...Category[]]
);
export const OptionalCategoryValue = Schema.UndefinedOr(CategoryValue);

export class CategoryInsert extends Schema.Class<CategoryInsert>("CategoryInsert")({
  category: CategoryValue,
}) {}

export class CategoryUpdate extends Schema.Class<CategoryUpdate>("CategoryUpdate")({
  id: PrimaryKeyIndex,
  category: CategoryValue,
}) {}

export class CategorySelect extends Schema.Class<CategorySelect>("CategorySelect")({
  id: PrimaryKeyIndex,
  category: CategoryValue,
  createdAt: Schema.Date,
  updatedAt: Schema.Date,
}) {}