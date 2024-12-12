import { Category as CategoryEnum } from "@/db/schemas/Category";

export const CATEGORIES = Object.values(CategoryEnum);

export class Category {
    id?: number;
    category: string;

    constructor(
        category: string,
        id?: number,
    ) { 
        this.category = category;
        this.id = id;
    }
}