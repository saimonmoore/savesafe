export enum CategorizationMethod {
    AI_BATCH = "ai_batch",
    AI_BATCH_ERROR = "ai_batch_error",
    STORED = "stored",
    PATTERN = "pattern",
    FUZZY = "fuzzy"
}

export enum Categories {
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

export const CATEGORIES = Object.values(Categories);

export class Category {
    category: string;

    constructor(
        category: string,
    ) { 
        this.category = category;
    }
}