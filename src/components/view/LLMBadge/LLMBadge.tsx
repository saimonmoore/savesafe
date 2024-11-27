import React, { useEffect } from "react";
import { BrainIcon } from 'lucide-react'

import { WebLLM } from '@/lib/webllm';
import { Button } from '@/components/ui/button'
import { AnimatedProgressIcon } from '@/components/view/AnimatedProgressIcon/AnimatedProgressIcon'

async function WebLLMPlayground(setModelReady: (ready: boolean) => void, setProgress: (progress: number) => void) {
  try {
    await WebLLM.initializeEngine({
      onModelLoading: (progress: number) => {
        setProgress(Math.round(progress * 100));
      },
      onModelReady: () => {
        setModelReady(true);
      },
      onModelError: (error: Error) => {
        console.error("Model initialization failed:", error);
      }
    });

  } catch (error) {
    console.error("Application Error:", error);
  }
}

function LLMBadge() {
  const [modelReady, setModelReady] = React.useState(false);
  const [progress, setProgress] = React.useState(0)

  useEffect(() => {
    WebLLMPlayground(setModelReady, setProgress);
  }, []);

  useEffect(() => {
    async function testWebLLM() {
      const response = await WebLLM.generateResponse([
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "Hello, how are you?" }
      ]);

      console.log("==========> LLM says: ", response.choices[0].message.content);
    }

    if (modelReady) {
      testWebLLM();
    }

  }, [modelReady]);

  return (
    <AnimatedProgressIcon progress={progress} icon={<BrainIcon className="h-4 w-4" />} />
  );
}

export { LLMBadge };