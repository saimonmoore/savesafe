export enum TransactionColumnNames {
    AMOUNT = 'AMOUNT',
    DESCRIPTION = 'DESCRIPTION',
    TRANSACTION_DATE = 'TRANSACTION DATE',
    EFFECTIVE_DATE = 'EFFECTIVE DATE',
    BALANCE = 'BALANCE'
}

export const TransactionColumnNamesMap = {
  "EFFECTIVE DATE": TransactionColumnNames.EFFECTIVE_DATE,
  "DATA COMPTABLE": TransactionColumnNames.EFFECTIVE_DATE,
  "FECHA CONTABLE": TransactionColumnNames.EFFECTIVE_DATE,
  "DATE COMPTABLE": TransactionColumnNames.EFFECTIVE_DATE,
  "BUCHUNGSDATUM": TransactionColumnNames.EFFECTIVE_DATE,
  "ΗΜΕΡΟΜΗΝΙΑ ΛΟΓΙΣΤΙΚΗΣ": TransactionColumnNames.EFFECTIVE_DATE,

  "TRANSACTION DATE": TransactionColumnNames.TRANSACTION_DATE,
  "FECHA VALOR": TransactionColumnNames.TRANSACTION_DATE,
  "DATA VALOR": TransactionColumnNames.TRANSACTION_DATE,
  "DATE VALEUR": TransactionColumnNames.TRANSACTION_DATE,
  "WERTSTELLUNG": TransactionColumnNames.TRANSACTION_DATE,
  "ΗΜΕΡΟΜΗΝΙΑ ΑΞΙΑΣ": TransactionColumnNames.TRANSACTION_DATE,
  "DATA OPERACIÓ": TransactionColumnNames.TRANSACTION_DATE,
  "DATA TRANSACCIÓ": TransactionColumnNames.TRANSACTION_DATE,
  "FECHA OPERACIÓN": TransactionColumnNames.TRANSACTION_DATE,
  "FECHA TRANSACCIÓN": TransactionColumnNames.TRANSACTION_DATE,
  "DATE OPÉRATION": TransactionColumnNames.TRANSACTION_DATE,
  "DATE DE TRANSACTION": TransactionColumnNames.TRANSACTION_DATE,
  "TRANSAKTIONSDATUM": TransactionColumnNames.TRANSACTION_DATE,
  "ΗΜΕΡΟΜΗΝΙΑ ΣΥΝΑΛΛΑΓΗΣ": TransactionColumnNames.TRANSACTION_DATE,
  "ΗΜΕΡΟΜΗΝΙΑ ΠΡΑΞΗΣ": TransactionColumnNames.TRANSACTION_DATE,

  "DESCRIPCION": TransactionColumnNames.DESCRIPTION,
  "DESCRIPCIÓ": TransactionColumnNames.DESCRIPTION,
  "DESCRIPCIO": TransactionColumnNames.DESCRIPTION,
  "CONCEPTE": TransactionColumnNames.DESCRIPTION,
  "CONCEPTO": TransactionColumnNames.DESCRIPTION,
  "LIBELLÉ": TransactionColumnNames.DESCRIPTION,
  "DESCRIPTION": TransactionColumnNames.DESCRIPTION,
  "BESCHREIBUNG": TransactionColumnNames.DESCRIPTION,
  "VERWENDUNGSZWECK": TransactionColumnNames.DESCRIPTION,
  "BUCHUNGSTEXT": TransactionColumnNames.DESCRIPTION,
  "ΠΕΡΙΓΡΑΦΗ": TransactionColumnNames.DESCRIPTION,
  "ΑΙΤΙΟΛΟΓΙΑ": TransactionColumnNames.DESCRIPTION,

  "AMOUNT": TransactionColumnNames.AMOUNT,
  "IMPORT": TransactionColumnNames.AMOUNT,
  "IMPORTE": TransactionColumnNames.AMOUNT,
  "MONTANT": TransactionColumnNames.AMOUNT,
  "BETRAG": TransactionColumnNames.AMOUNT,
  "ΠΟΣΟ": TransactionColumnNames.AMOUNT,
  "QUANTITAT": TransactionColumnNames.AMOUNT,
  "CANTIDAD": TransactionColumnNames.AMOUNT,
  "SOMME": TransactionColumnNames.AMOUNT,
  "SUMME": TransactionColumnNames.AMOUNT,
  "ΠΟΣΟΝ": TransactionColumnNames.AMOUNT,

  "BALANCE": TransactionColumnNames.BALANCE,
  "SALDO": TransactionColumnNames.BALANCE,
  "SOLDE": TransactionColumnNames.BALANCE,
  "KONTOSTAND": TransactionColumnNames.BALANCE,
  "ΥΠΟΛΟΙΠΟ": TransactionColumnNames.BALANCE,
  "SALDO DISPONIBLE": TransactionColumnNames.BALANCE,
  "SOLDE DISPONIBLE": TransactionColumnNames.BALANCE,
  "VERFÜGBARER BETRAG": TransactionColumnNames.BALANCE,
  "ΔΙΑΘΕΣΙΜΟ ΥΠΟΛΟΙΠΟ": TransactionColumnNames.BALANCE
}