import React, { useEffect } from "react";
import { BrainIcon } from 'lucide-react'

import { WebLLM } from '@/lib/LLM/WebLLMManager';
import { AnimatedProgressIcon } from '@/components/view/AnimatedProgressIcon/AnimatedProgressIcon'
import { useStore } from "@/stores";

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

async function testWebLLM() {
  const categories = [
    'housing', 'utilities', 'food', 'transport', 'technology',
    'entertainment', 'finance', 'education', 'healthcare',
    'shopping', 'telecommunications', 'other'
  ];
  const merchants = ['RECIBO /Som Energia, SCCL', 'RECIBO /PROMOCIO SOCIAL URBANA', 'COM. USO REDES INTERNACION.', 'BACKBLAZE.COM', 'RECIBO VISA CLASICA', 'BAR CENTRE CATOLIC', 'RUSTCO RUBIO I ORS', 'LA TABERNA DE LA RAMBLA', 'CASA AMETLLER', 'CASA AMETLLER', 'PUNJAB 2019 CATALUNYA', 'RECIBO /IN PRO PAT 28 S.L.', 'PAGO BIZUM A Gemma;Oliveras;Es', 'GUARDIAN NEWS & MEDIA', 'PAGO BIZUM A Eulalia;Pinyol;Ol', 'RUSTCO RUBIO I ORS', 'CLUBER', 'PIRINEU EN BOCA', 'AUTOPISTA PEREZ', 'EROICA CAFFE', 'CAPRABO 7766', 'CAPRABO 7766', 'CAPRABO CORNELLA', 'RECIBO /Som Connexio SCCL', 'AENA AEROPUERTOS', 'EL RACO DE LA SALUT', 'CAPRABO 7766', 'COMIS. MANT.', 'AENA AEROPUERTOS', 'COM. USO REDES INTERNACION.', 'BACKBLAZE.COM'];
  console.time(`Inference on ${merchants.length} transactions`);

  // const response = await WebLLM.generateResponse([
  //   {
  //     role: "system", content: `You are a financial categorization expert. Respond with a json array of categories matching the input merchants.
  //                         Use only these categories: ${categories.join(', ')}
  //                         Format: "[{ Merchant1:Category1}, {Merchant2:Category2}, ...]"` },
  //   {
  //     role: "user",

  //     content: `Categorize these transactions merchants: ${merchants.join(', ')}`
  //   }
  // ]);

  const response = await WebLLM.requestInference([
    {
      role: "system", content: `You are a financial categorization expert. Respond with a json array of categories matching the input merchants.
                              Use only these categories: ${categories.join(', ')}
                              Format: "[{ Merchant1:Category1}, {Merchant2:Category2}, ...]"` },
    {
      role: "user",

      content: `Categorize these transactions merchants: ${merchants.join(', ')}`
    }
  ]);

  // Categorize each transaction into a single general category (e.g., 'utilities', 'food', 'transport') respond only with a single word per transaction in the following list: 'RECIBO /Som Energia, SCCL', 'RECIBO /PROMOCIO SOCIAL URBANA', 'COM. USO REDES INTERNACION.', 'BACKBLAZE.COM', 'RECIBO VISA CLASICA', 'BAR CENTRE CATOLIC', 'RUSTCO RUBIO I ORS', 'LA TABERNA DE LA RAMBLA', 'CASA AMETLLER', 'CASA AMETLLER', 'PUNJAB 2019 CATALUNYA', 'RECIBO /IN PRO PAT 28 S.L.', 'PAGO BIZUM A Gemma;Oliveras;Es', 'GUARDIAN NEWS & MEDIA', 'PAGO BIZUM A Eulalia;Pinyol;Ol', 'RUSTCO RUBIO I ORS', 'CLUBER', 'PIRINEU EN BOCA', 'AUTOPISTA PEREZ', 'EROICA CAFFE', 'CAPRABO 7766', 'CAPRABO 7766', 'CAPRABO CORNELLA', 'RECIBO /Som Connexio SCCL', 'AENA AEROPUERTOS', 'EL RACO DE LA SALUT', 'CAPRABO 7766', 'COMIS. MANT.', 'AENA AEROPUERTOS', 'COM. USO REDES INTERNACION.', 'BACKBLAZE.COM'.

  console.log("[LLMBadge] ==========> LLM says: ", response.choices[0].message.content);
  console.timeEnd(`Inference on ${merchants.length} transactions`);
}

function LLMBadge() {
  const { setLlmReady } = useStore(state => (state));
  const [progress, setProgress] = React.useState(0)

  useEffect(() => {
    WebLLMPlayground(setLlmReady, setProgress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AnimatedProgressIcon progress={progress} icon={<BrainIcon className="h-4 w-4" />} />
  );
}

export { LLMBadge };
