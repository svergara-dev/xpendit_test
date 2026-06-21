import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { HttpException } from '@nestjs/common';
import { ExchangeRateService } from '../exchange-rate.service';
import { ExchangeRateResponse } from '../dto/exchange-rate-response.dto';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';

describe('ExchangeRateService', () => {
  let service: ExchangeRateService;

  const mockRates: ExchangeRateResponse = {
    disclaimer: 'Test',
    license: 'https://test.com',
    timestamp: 1700000000,
    base: 'USD',
    rates: {
      USD: 1,
      CLP: 950.5,
      MXN: 17.2,
      EUR: 0.92,
    },
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('test-api-key'),
  };

  const mockHttpService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExchangeRateService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: HttpService, useValue: mockHttpService },
      ],
    }).compile();

    service = module.get<ExchangeRateService>(ExchangeRateService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getRates', () => {
    it('should fetch latest rates successfully', async () => {
      const mockResponse: AxiosResponse<ExchangeRateResponse> = {
        data: mockRates,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getRates();

      expect(result).toEqual(mockRates);
      expect(mockHttpService.get).toHaveBeenCalledWith(
        'https://openexchangerates.org/api/latest.json',
        { params: { app_id: 'test-api-key' } },
      );
    });

    it('should fetch historical rates for specific date', async () => {
      const mockResponse: AxiosResponse<ExchangeRateResponse> = {
        data: mockRates,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getRates('2025-01-15');

      expect(result).toEqual(mockRates);
      expect(mockHttpService.get).toHaveBeenCalledWith(
        'https://openexchangerates.org/api/historical/2025-01-15.json',
        { params: { app_id: 'test-api-key' } },
      );
    });

    it('should include symbols parameter when provided', async () => {
      const mockResponse: AxiosResponse<ExchangeRateResponse> = {
        data: mockRates,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.get.mockReturnValue(of(mockResponse));

      await service.getRates(undefined, ['CLP', 'MXN']);

      expect(mockHttpService.get).toHaveBeenCalledWith(
        'https://openexchangerates.org/api/latest.json',
        { params: { app_id: 'test-api-key', symbols: 'CLP,MXN' } },
      );
    });

    it('should cache responses and not make duplicate API calls', async () => {
      const mockResponse: AxiosResponse<ExchangeRateResponse> = {
        data: mockRates,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.get.mockReturnValue(of(mockResponse));

      await service.getRates();
      await service.getRates();

      expect(mockHttpService.get).toHaveBeenCalledTimes(1);
    });

    it('should throw HttpException on 401 error', async () => {
      mockHttpService.get.mockReturnValue(
        throwError(() => ({
          response: { status: 401 },
          message: 'Unauthorized',
        })),
      );

      await expect(service.getRates()).rejects.toThrow(HttpException);
    });

    it('should throw HttpException on 403 error', async () => {
      mockHttpService.get.mockReturnValue(
        throwError(() => ({
          response: { status: 403 },
          message: 'Forbidden',
        })),
      );

      await expect(service.getRates()).rejects.toThrow(HttpException);
    });

    it('should throw HttpException on network error', async () => {
      mockHttpService.get.mockReturnValue(
        throwError(() => ({
          message: 'Network Error',
        })),
      );

      await expect(service.getRates()).rejects.toThrow(HttpException);
    });
  });

  describe('convert', () => {
    it('should convert between currencies correctly', async () => {
      const mockResponse: AxiosResponse<ExchangeRateResponse> = {
        data: mockRates,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.convert(100, 'CLP', 'USD');

      expect(result).toBeCloseTo(0.1052, 4);
    });

    it('should return same amount when converting same currency', async () => {
      const result = await service.convert(100, 'USD', 'USD');

      expect(result).toBe(100);
      expect(mockHttpService.get).not.toHaveBeenCalled();
    });

    it('should throw error for unknown source currency', async () => {
      const mockResponse: AxiosResponse<ExchangeRateResponse> = {
        data: mockRates,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.get.mockReturnValue(of(mockResponse));

      await expect(service.convert(100, 'XXX', 'USD')).rejects.toThrow(HttpException);
    });

    it('should throw error for unknown target currency', async () => {
      const mockResponse: AxiosResponse<ExchangeRateResponse> = {
        data: mockRates,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.get.mockReturnValue(of(mockResponse));

      await expect(service.convert(100, 'USD', 'YYY')).rejects.toThrow(HttpException);
    });
  });
});
