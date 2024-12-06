import { create } from "zustand"
import { createLLMStore, LLMStore } from './LLMStore';

export const useStore = create<LLMStore>()((...a) => ({
    ...createLLMStore(...a),
}))