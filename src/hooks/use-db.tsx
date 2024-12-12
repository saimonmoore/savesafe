import { Context } from "effect";
import { createContext, useContext } from "react";
import { Pglite } from "@/services/pglite";

export const DBContext = createContext<
  Context.Tag.Service<typeof Pglite>["orm"] | null
>(null);

export const useDB = () => {
  const orm = useContext(DBContext);
  if (orm === null) {
    throw new Error(
      "useDB must be used within DBContext.Provider"
    );
  }
  return orm;
};
