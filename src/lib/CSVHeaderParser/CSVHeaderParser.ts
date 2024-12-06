import { TransactionParserError, NotCSVParserError } from "@/lib/TransactionParser/errors";
import { WorkerLLMManager } from "@/lib/LLM/WorkerLLMManager";

interface CSVHeaders {
    headers: string;
}

type AIHeaderExtractionResponse = { error: string } | CSVHeaders;

class CSVHeaderParser {
    private llmManager: WorkerLLMManager;

    constructor() {
        this.llmManager = WorkerLLMManager.getInstance();
    }

    public async extractWithAI(headerLines: string): Promise<string> {
        const prompt = `
You are an expert in identifying the table headers from csv files.

Respond with a JSON object with these fields:
{
    "headers": "the original detected line of CSV headers",
}

If the input does not contain CSV table headers respond with "{ error: 'not_csv'}".
Extract the table headers from this csv file:

${headerLines}
        `;

        const response = await this.llmManager.requestInference([
            { role: "system", content: "You are an experienced CSV expert that identifies CSV headers." },
            { role: "user", content: prompt }
        ]);

        let aiContent: AIHeaderExtractionResponse;

        try {
            aiContent = JSON.parse(response.choices[0].message.content || '{}');
        } catch (error: unknown) {
            throw new TransactionParserError(`Failed to parse AI response to valid CSV headers: ${error}`);
        }

        if ('error' in aiContent) {
            switch (aiContent.error) {
                case 'not_csv':
                    throw new NotCSVParserError('AI determined the content is not a CSV file');
                default:
                    throw new TransactionParserError(`AI responded with unknown error: ${aiContent.error}`);
            }
        }

        return aiContent.headers;
    }
}

export { CSVHeaderParser };