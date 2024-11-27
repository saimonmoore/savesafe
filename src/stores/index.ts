import { create } from "zustand"
import { createLLMStore, LLMStore } from './llm-store';

export const useStore = create<LLMStore>()((...a) => ({
    ...createLLMStore(...a),
}))