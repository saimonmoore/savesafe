import { StateCreator } from 'zustand'

export interface LLMStore {
  llmReady: boolean
  setllmReady: (ready: boolean) => void
}

export const createLLMStore: StateCreator<
  LLMStore,
  [],
  [],
  LLMStore
> = (set) => ({
  llmReady: false,
  setllmReady: (ready: boolean) => set(() => ({ llmReady: ready })),
})