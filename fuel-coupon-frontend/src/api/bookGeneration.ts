// src/api/bookGeneration.ts
import apiClient from './index';

// TypeScript interfaces for centralized book generation
export interface BookGenerationRequest {
  batch_id: number;
  first_serial: string;
  last_serial: string;
  books_per_box?: number;
  coupons_per_book?: number;
  force?: boolean;
}

export interface ValidationRequest {
  batch_id: number;
  first_serial: string;
  last_serial: string;
  books_per_box?: number;
  coupons_per_book?: number;
  force?: boolean;
}

export interface BookRange {
  book_number: number;
  first_coupon: string;
  last_coupon: string;
  coupon_count: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  plan: {
    batch: {
      id: number;
      batch_code: string;
      fuel_type: string;
      denomination: number;
    };
    book_ranges: BookRange[];
    total_books: number;
    total_coupons: number;
    expected_coupons: number;
  };
}

export interface GenerationResult {
  success: boolean;
  message: string;
  data?: {
    box_id: number;
    box_code: string;
    books_created: number;
    coupons_created: number;
    serial_range: {
      first: string;
      last: string;
    };
    book_details: Array<{
      book_number: number;
      first_coupon: string;
      last_coupon: string;
      total_coupons: number;
    }>;
  };
  errors?: string[];
  warnings?: string[];
}

export interface BatchGenerationStatus {
  box_id: number;
  box_code: string;
  has_books: boolean;
  book_count: number;
  coupon_count: number;
  serial_range?: {
    first: string;
    last: string;
  };
  is_complete: boolean;
  books: Array<{
    book_number: number;
    first_coupon: string;
    last_coupon: string;
    total_coupons: number;
    actual_coupons: number;
  }>;
}

// Centralized Book Generation API Service
export const bookGenerationAPI = {
  /**
   * Generate books and coupons for a batch using centralized service
   * This is the SINGLE SOURCE OF TRUTH for book generation
   */
  generateBooks: async (data: BookGenerationRequest): Promise<GenerationResult> => {
    try {
      const response = await apiClient.post('/books/generate_books_for_box/', data);
      return response.data;
    } catch (error: any) {
      console.error('Error generating books:', error);
      throw error;
    }
  },

  /**
   * Generate books for a specific batch (alternative endpoint)
   */
  generateBooksForBatch: async (batchId: number, data: Omit<BookGenerationRequest, 'batch_id'>): Promise<GenerationResult> => {
    try {
      const response = await apiClient.post(`/batches/${batchId}/generate_books/`, data);
      return response.data;
    } catch (error: any) {
      console.error('Error generating books for batch:', error);
      throw error;
    }
  },

  /**
   * Validate a book generation request without actually generating
   */
  validateRequest: async (data: ValidationRequest): Promise<ValidationResult> => {
    try {
      const response = await apiClient.post('/books/validate_generation_request/', data);
      return response.data;
    } catch (error: any) {
      console.error('Error validating generation request:', error);
      throw error;
    }
  },

  /**
   * Get the generation status of a batch
   */
  getBatchStatus: async (batchId: number): Promise<BatchGenerationStatus> => {
    try {
      const response = await apiClient.get(`/books/batch_generation_status/?batch_id=${batchId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error getting batch generation status:', error);
      throw error;
    }
  },

  /**
   * Preview book ranges without generating
   */
  previewBookRanges: async (boxId: number): Promise<any> => {
    try {
      const response = await apiClient.get(`/boxes/${boxId}/coupon_ranges_preview/`);
      return response.data;
    } catch (error: any) {
      console.error('Error previewing book ranges:', error);
      throw error;
    }
  }
};

export default bookGenerationAPI;
