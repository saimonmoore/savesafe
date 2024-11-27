import { WebLLM } from "@/lib/webllm"
import { LLMBadge } from "@/components/view/LLMBadge/LLMBadge";
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

export function LLMInfo() {
    const llmModel = WebLLM.selectedModel;

    return (
        <Dialog>
            <DialogTrigger>
                <LLMBadge />
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>LLM Ready</DialogTitle>
                    <DialogDescription className="pt-4 lh-4">
                        Savesafe uses an in-browser Large Language Model to do all inference.
                        Your data never leaves the browser!
                        <span className="block mt-4">
                            Model: <strong>{llmModel}</strong>
                        </span>
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button>OK</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
