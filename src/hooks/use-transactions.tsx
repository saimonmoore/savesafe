import { useQuery } from "@/hooks/use-query";
import { transactionTable } from "@/db/schemas/Transaction";
import { TransactionSelect } from "@/schemas/Transaction";

export const useTransactions = () => {
  return useQuery((orm) => orm.select().from(transactionTable).toSQL(), TransactionSelect);
};