import { Categories } from "@/db/schemas/Category";

export const CATEGORIES = Object.values(Categories);

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