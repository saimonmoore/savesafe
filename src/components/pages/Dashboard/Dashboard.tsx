import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
// import { AreaChart } from "@/components/view/Charts/AreaChart/AreaChart";
// import { BarChart } from "@/components/view/Charts/BarChart/BarChart";
import { DonutChart } from "@/components/view/Charts/DonutChart/DonutChart";
import { StackedAreaChart } from "@/components/view/Charts/StackedAreaChart/StackedAreaChart";
import { ErrorAlert } from "@/components/view/Error/ErrorAlert";
import { FileUploader } from "@/components/view/FileUploader/FileUploader";
import { Transaction } from "@/domain/models/Transaction/Transaction";
import { useTransactions } from "@/hooks/use-transactions";
import { TransactionProcessor } from "@/lib/TransactionProcessor/TransactionProcessor";
import { useStore } from "@/stores";
import { Match } from "effect";
import { pipe } from "effect";
import { Either } from "effect";
import { DollarSign, Loader2, TrendingDown, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

function processTransactions(uploadedFiles: File[], setRawTransactions: (transactions: Transaction[]) => void) {
  try {
    TransactionProcessor.getInstance().process(uploadedFiles, setRawTransactions)
  } catch (TransactionParserError) {
    console.error("Error parsing transactions:", TransactionParserError);
  }
};

export default function Dashboard() {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [parsingTransactions, setParsingTransactions] = useState<boolean>(false)
  const [rawTransactions, setRawTransactions] = useState<Transaction[]>([])

  const {llmReady} = useStore(state => (state));

  const handleFilesUploaded = (files: File[]) => {
    setUploadedFiles(files)
  }

  useEffect(() => {
    function processFiles() {
      processTransactions(uploadedFiles, setRawTransactions);
      setUploadedFiles([]);
    }

    if (uploadedFiles.length > 0) {
      setParsingTransactions(true);
      processFiles();
    }

  }, [uploadedFiles])

  useEffect(() => {
    console.log("Raw transactions:", rawTransactions)
    if (rawTransactions.length > 0) {
      setParsingTransactions(false);
    }
  }, [rawTransactions])

  const MAX_FILES = 3;
  const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
  const SUPPORTED_FILE_TYPES = {
    // "application/vnd.ms-excel": [".xls", ".xlt"],
    // "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
    // "application/vnd.openxmlformats-officedocument.spreadsheetml.template": [".xltx"],
    // "application/vnd.ms-excel.addin.macroEnabled.12": [".xlam"],
    // "application/vnd.ms-excel.sheet.binary.macroEnabled.12": [".xlsb"],
    // "application/vnd.oasis.opendocument.spreadsheet": [".ods"],
    // "application/vnd.apple.numbers": [".numbers"],
    // "application/vnd.lotus-1-2-3": [".wk1", ".wk3", ".wk4"],
    "text/csv": [".csv"],
    // "text/tab-separated-values": [".tsv"],
    // "application/x-prn": [".prn"],
    // "application/json": [".json"],
    // "application/pdf": [".pdf"]
  }

  const transactions = useTransactions();

  if (Either.isLeft(transactions)) {
    return pipe(
      transactions.left,
      Match.valueTags({
        MissingData: () => (
          <ErrorAlert message="No transactions found" />
        ),
        InvalidData: ({ parseError }) => (
          <ErrorAlert message="Invalid data" error={parseError} />
        ),
      })
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        {/* TODO: Disable upload button while LLM is not ready; EventEmitter */}
        {parsingTransactions && (
          <Button disabled>
            <Loader2 className="animate-spin" />
            Parsing Transactions...
          </Button>)
        }
        {!parsingTransactions && <FileUploader
          maxFiles={MAX_FILES}
          maxSize={MAX_FILE_SIZE}
          accept={SUPPORTED_FILE_TYPES}
          onFilesUploaded={handleFilesUploaded}
          dropzoneText={{
            title: "Upload transactions",
            description: "Drop your files here or click to browse",
            dragActive: "Drop the files here",
            fileCount: `Upload up to ${MAX_FILES} files (max ${MAX_FILE_SIZE}MB each)`,
            allowedTypes: "Allowed file types:",
          }}
          disabled={!llmReady}
        />}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$12,345.67</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$5,432.10</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$3,456.78</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Savings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$1,975.32</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.right.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>{transaction.transactionDate.toLocaleDateString()}</TableCell>
                  <TableCell>{transaction.merchant}</TableCell>
                  <TableCell>{transaction.category}</TableCell>
                  <TableCell className="text-right">
                    {transaction.amount.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <DonutChart />
      <StackedAreaChart />
    </div>
  );
}
