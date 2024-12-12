import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface ErrorAlertProps {
  message: string;
  error?: Error;
  tryAgain?: () => void;
}

export function ErrorAlert({ message, error, tryAgain }: ErrorAlertProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="grid gap-2">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription className="mb-4">{message}</AlertDescription>
        <button
          onClick={() => {
            tryAgain?.();
          }}
          className="text-xs text-red-800 hover:text-red-900 transition-colors mt-2 font-medium underline"
        >
          Try again
        </button>
        {error && (
          <>
            <button
              onClick={() => {
                setIsExpanded(!isExpanded);
                tryAgain?.();
              }}
              className="text-xs text-red-800 hover:text-red-900 transition-colors mt-2 font-medium underline"
            >
              {isExpanded ? "Hide details" : "Show details"}
            </button>
            {isExpanded && (
              <div className="mt-4 pt-2 border-t border-destructive-foreground/20">
                <h4 className="text-sm font-semibold mb-1">{error.message}</h4>
                <pre className="text-xs whitespace-pre-wrap overflow-x-auto max-h-40 bg-destructive-foreground/10 p-2 rounded">
                  {error.stack}
                </pre>
              </div>
            )}
          </>
        )}
      </Alert>
    </div>
  );
}
