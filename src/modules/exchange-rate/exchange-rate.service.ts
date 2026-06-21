import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ExchangeRateResponse } from './dto/exchange-rate-response.dto';

@Injectable()
export class ExchangeRateService {
  private readonly appId: string;
  private readonly baseUrl = 'https://openexchangerates.org/api';
  private readonly cache = new Map<string, ExchangeRateResponse>();

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    const appId = this.configService.get<string>('OPEN_EXCHANGE_RATES_APP_ID');
    if (!appId) {
      throw new Error('OPEN_EXCHANGE_RATES_APP_ID is not configured');
    }
    this.appId = appId;
  }

  async getRates(date?: string, symbols?: string[]): Promise<ExchangeRateResponse> {
    const cacheKey = this.buildCacheKey(date, symbols);

    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const response = await this.fetchRates(date, symbols);
    this.cache.set(cacheKey, response);
    return response;
  }

  async convert(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    date?: string,
  ): Promise<number> {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    const rates = await this.getRates(date);
    const fromRate = rates.rates[fromCurrency];
    const toRate = rates.rates[toCurrency];

    if (!fromRate) {
      throw new HttpException(
        `Currency '${fromCurrency}' not found in exchange rates`,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!toRate) {
      throw new HttpException(
        `Currency '${toCurrency}' not found in exchange rates`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const amountInBase = amount / fromRate;
    return amountInBase * toRate;
  }

  private buildCacheKey(date?: string, symbols?: string[]): string {
    const datePart = date || 'latest';
    const symbolsPart = symbols ? symbols.sort().join(',') : 'all';
    return `${datePart}:${symbolsPart}`;
  }

  private async fetchRates(date?: string, symbols?: string[]): Promise<ExchangeRateResponse> {
    const endpoint = date ? `historical/${date}.json` : 'latest.json';
    const url = `${this.baseUrl}/${endpoint}`;

    const params: Record<string, string> = {
      app_id: this.appId,
    };

    if (symbols && symbols.length > 0) {
      params.symbols = symbols.join(',');
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get<ExchangeRateResponse>(url, { params }),
      );
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        throw new HttpException('Invalid API key for Open Exchange Rates', HttpStatus.UNAUTHORIZED);
      }
      if (error.response?.status === 403) {
        throw new HttpException(
          'API rate limit exceeded or subscription required',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      throw new HttpException(
        `Failed to fetch exchange rates: ${error.message}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}
