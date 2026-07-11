export const CUR_SYMBOLS: Record<string, string> = {
  EUR: "€", DZD: "DA", USD: "$", GBP: "£", CHF: "CHF", CAD: "$", MAD: "MAD", XOF: "CFA",
};

export const curSym = (currency: string): string => CUR_SYMBOLS[currency] || currency;

export function formatAmount(n: number, currency: string): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n);
}

export const CURRENCIES: [string, string][] = [
  ["EUR", "€ Euro"], ["DZD", "DA Dinar algérien"], ["USD", "$ Dollar US"], ["GBP", "£ Livre"],
  ["CHF", "CHF Franc suisse"], ["CAD", "$ Dollar canadien"], ["MAD", "MAD Dirham"], ["XOF", "CFA Franc CFA"],
];
