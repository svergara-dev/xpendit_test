export interface ExchangeRateResponse {
  disclaimer: string;
  license: string;
  timestamp: number;
  base: string;
  rates: { [currency: string]: number };
}
