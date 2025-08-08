import apiClient from './index';

export interface PetroTradeBoxRequest {
  first_coupon: string;
  last_coupon: string;
  fuel_type: 'PETROL' | 'DIESEL';
  denomination: number;
  coupons_per_book: number;
  create_coupons: boolean;
}

export interface PetroTradeBoxResponse {
  message: string;
  box: {
    id: number;
    box_code: string;
    fuel_type: string;
    denomination: number;
    first_coupon: string;
    last_coupon: string;
    total_books: number;
    total_coupons: number;
    coupons_created: number;
  };
  books: Array<{
    book_number: string;
    first_coupon: string;
    last_coupon: string;
    coupon_count: number;
  }>;
}

export interface SerialValidationResponse {
  is_valid: boolean;
  prefix: string;
  number: number;
  formatted: string;
  error?: string;
}

export interface BookRange {
  book_number: number;
  first_serial: string;
  last_serial: string;
  coupon_count: number;
}

export const petrotradeApi = {
  /**
   * Create a new PetroTrade box with sequential coupon serials
   */
  createBox: async (data: PetroTradeBoxRequest): Promise<PetroTradeBoxResponse> => {
    const response = await apiClient.post('/boxes/create_petrotrade_box/', data);
    return response.data;
  },

  /**
   * Validate PetroTrade serial format (client-side)
   */
  validateSerial: (serial: string): SerialValidationResponse => {
    const cleaned = serial.trim().toUpperCase();
    const pattern = /^([A-Z0-9]+[A-Z])(\d{6})$/;
    const match = cleaned.match(pattern);
    
    if (!match) {
      return {
        is_valid: false,
        prefix: '',
        number: 0,
        formatted: cleaned,
        error: 'Invalid format. Expected: PU006H355101'
      };
    }
    
    return {
      is_valid: true,
      prefix: match[1],
      number: parseInt(match[2]),
      formatted: cleaned
    };
  },

  /**
   * Generate serial range between two serials
   */
  generateRange: (firstSerial: string, lastSerial: string): string[] => {
    const first = petrotradeApi.validateSerial(firstSerial);
    const last = petrotradeApi.validateSerial(lastSerial);
    
    if (!first.is_valid || !last.is_valid) {
      throw new Error('Invalid serial format');
    }
    
    if (first.prefix !== last.prefix) {
      throw new Error('Serials must have the same prefix');
    }
    
    if (first.number >= last.number) {
      throw new Error('Last serial must be greater than first serial');
    }
    
    const serials: string[] = [];
    for (let i = first.number; i <= last.number; i++) {
      serials.push(`${first.prefix}${i.toString().padStart(6, '0')}`);
    }
    
    return serials;
  },

  /**
   * Split serial range into books
   */
  splitIntoBooks: (firstSerial: string, lastSerial: string, couponsPerBook: number): BookRange[] => {
    const serials = petrotradeApi.generateRange(firstSerial, lastSerial);
    const books: BookRange[] = [];
    
    for (let i = 0; i < serials.length; i += couponsPerBook) {
      const bookSerials = serials.slice(i, i + couponsPerBook);
      const bookNumber = Math.floor(i / couponsPerBook) + 1;
      
      books.push({
        book_number: bookNumber,
        first_serial: bookSerials[0],
        last_serial: bookSerials[bookSerials.length - 1],
        coupon_count: bookSerials.length
      });
    }
    
    return books;
  },

  /**
   * Calculate totals for a serial range
   */
  calculateTotals: (firstSerial: string, lastSerial: string, denominationPerCoupon: number) => {
    const first = petrotradeApi.validateSerial(firstSerial);
    const last = petrotradeApi.validateSerial(lastSerial);
    
    if (!first.is_valid || !last.is_valid) {
      return {
        totalCoupons: 0,
        totalLitres: 0,
        isValid: false,
        error: 'Invalid serial format'
      };
    }
    
    if (first.prefix !== last.prefix) {
      return {
        totalCoupons: 0,
        totalLitres: 0,
        isValid: false,
        error: 'Serials must have the same prefix'
      };
    }
    
    if (first.number >= last.number) {
      return {
        totalCoupons: 0,
        totalLitres: 0,
        isValid: false,
        error: 'Last serial must be greater than first serial'
      };
    }
    
    const totalCoupons = last.number - first.number + 1;
    const totalLitres = totalCoupons * denominationPerCoupon;
    
    return {
      totalCoupons,
      totalLitres,
      isValid: true
    };
  }
};

export default petrotradeApi;
