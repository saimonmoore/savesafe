import { StateCreator } from 'zustand'

export interface LLMStore {
  llmReady: boolean
  setLlmReady: (ready: boolean) => void
}

export const createLLMStore: StateCreator<
  LLMStore,
  [],
  [],
  LLMStore
> = (set) => ({
  llmReady: false,
  setLlmReady: (ready: boolean) => set(() => ({ llmReady: ready })),
})