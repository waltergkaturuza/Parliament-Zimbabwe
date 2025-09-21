// src/services/subCenterStockService.ts
import apiClient from '@/api';
import dayjs from 'dayjs';

interface HandoverReceiptItem {
  id: string;
  dispatch_id: string;
  from_center: string;
  to_center: string;
  fuel_type: 'PETROL' | 'DIESEL';
  books: BookReceiptInfo[];
  total_books: number;
  total_coupons: number;
  total_liters: number;
  received_date: string;
  received_by: string;
  status: 'RECEIVED';
}

interface BookReceiptInfo {
  id: string;
  book_number: string;
  coupon_amount: 5 | 10 | 20 | 25;
  total_coupons: number;
  first_coupon_serial: string;
  last_coupon_serial: string;
  fuel_type: 'PETROL' | 'DIESEL';
  total_liters: number;
}

interface BeneficiaryDispatchRecord {
  id: string;
  beneficiary_id: string;
  beneficiary_name: string;
  liters_dispatched: number;
  coupons_dispatched: number;
  fuel_type: 'PETROL' | 'DIESEL';
  dispatch_date: string;
  status: 'DISPATCHED' | 'USED' | 'EXPIRED';
  subcenter_id: string;
}

interface StockCalculationResult {
  fuelType: 'PETROL' | 'DIESEL';
  totalReceived: {
    books: number;
    coupons: number;
    liters: number;
  };
  totalDispensed: {
    beneficiaries: number;
    coupons: number;
    liters: number;
  };
  availableStock: {
    books: number;
    coupons: number;
    liters: number;
  };
  reconciliation: {
    isBalanced: boolean;
    discrepancy: number;
    lastReconciled: string;
  };
}

interface SubCenterStock {
  petrol: StockCalculationResult;
  diesel: StockCalculationResult;
  lastUpdated: string;
  subcenterId: string;
  subcenterName: string;
}

export class SubCenterStockService {
  private subcenterId: string;

  constructor(subcenterId: string) {
    this.subcenterId = subcenterId;
  }

  /**
   * Intelligent stock calculation based on handover receipts minus beneficiary dispatches
   * This is the core intelligence that tracks what coupons were received vs what was distributed
   */
  async calculateCurrentStock(): Promise<SubCenterStock> {
    try {
      console.log('🔍 Calculating intelligent stock for subcenter:', this.subcenterId);

      // Fetch received handovers (where status = 'RECEIVED')
      const receivedHandovers = await this.fetchReceivedHandovers();
      console.log('📥 Received handovers:', receivedHandovers.length);

      // Fetch beneficiary dispatches from this subcenter
      const beneficiaryDispatches = await this.fetchBeneficiaryDispatches();
      console.log('📤 Beneficiary dispatches:', beneficiaryDispatches.length);

      // Calculate stock for each fuel type
      const petrolStock = await this.calculateFuelTypeStock('PETROL', receivedHandovers, beneficiaryDispatches);
      const dieselStock = await this.calculateFuelTypeStock('DIESEL', receivedHandovers, beneficiaryDispatches);

      const stockResult: SubCenterStock = {
        petrol: petrolStock,
        diesel: dieselStock,
        lastUpdated: dayjs().toISOString(),
        subcenterId: this.subcenterId,
        subcenterName: await this.getSubCenterName()
      };

      console.log('✅ Calculated intelligent stock:', stockResult);
      return stockResult;

    } catch (error) {
      console.error('❌ Error calculating subcenter stock:', error);
      throw new Error('Failed to calculate subcenter stock');
    }
  }

  /**
   * Fetch handovers where this subcenter received coupons (status = 'RECEIVED')
   */
  private async fetchReceivedHandovers(): Promise<HandoverReceiptItem[]> {
    try {
      // Fetch from dispatches table where to_center = this subcenter and status = 'RECEIVED'
      const response = await apiClient.get(`/dispatches/`, {
        params: {
          to_center: this.subcenterId,
          status: 'RECEIVED',
          page_size: 1000
        }
      });

      const dispatches = response.data.results || response.data || [];
      
      return dispatches.map((dispatch: any) => ({
        id: dispatch.id,
        dispatch_id: dispatch.dispatch_id || `DSP-${dispatch.id}`,
        from_center: dispatch.from_center?.name || dispatch.from_center || 'Main Center',
        to_center: dispatch.to_center?.name || dispatch.to_center || 'Unknown',
        fuel_type: dispatch.fuel_type || 'PETROL',
        books: this.extractBookInfo(dispatch.books || dispatch.book_dispatches || []),
        total_books: dispatch.total_books || (dispatch.books?.length || 0),
        total_coupons: dispatch.total_coupons || this.calculateTotalCoupons(dispatch.books || []),
        total_liters: dispatch.total_liters || this.calculateTotalLiters(dispatch.books || []),
        received_date: dispatch.received_date || dispatch.updated_date || dispatch.created_date,
        received_by: dispatch.received_by?.full_name || dispatch.received_by || 'System',
        status: 'RECEIVED'
      }));

    } catch (error) {
      console.error('Error fetching received handovers:', error);
      return [];
    }
  }

  /**
   * Fetch beneficiary dispatches made from this subcenter
   */
  private async fetchBeneficiaryDispatches(): Promise<BeneficiaryDispatchRecord[]> {
    try {
      // Fetch coupon dispatches made by this subcenter to beneficiaries
      const response = await apiClient.get(`/coupon-dispatches/`, {
        params: {
          subcenter_id: this.subcenterId,
          page_size: 1000
        }
      });

      const dispatches = response.data.results || response.data || [];
      
      return dispatches.map((dispatch: any) => ({
        id: dispatch.id,
        beneficiary_id: dispatch.beneficiary?.id || dispatch.beneficiary_id,
        beneficiary_name: dispatch.beneficiary?.user?.full_name || 
                        `${dispatch.beneficiary?.user?.first_name} ${dispatch.beneficiary?.user?.last_name}` ||
                        dispatch.beneficiary_name || 'Unknown Beneficiary',
        liters_dispatched: dispatch.liters_dispensed || dispatch.liters_dispatched || 0,
        coupons_dispatched: dispatch.coupons_dispensed || dispatch.coupons_dispatched || 0,
        fuel_type: dispatch.fuel_type || 'PETROL',
        dispatch_date: dispatch.dispatch_date || dispatch.created_date,
        status: dispatch.status || 'DISPATCHED',
        subcenter_id: this.subcenterId
      }));

    } catch (error) {
      console.error('Error fetching beneficiary dispatches:', error);
      return [];
    }
  }

  /**
   * Calculate stock for a specific fuel type with intelligent reconciliation
   */
  private async calculateFuelTypeStock(
    fuelType: 'PETROL' | 'DIESEL', 
    receivedHandovers: HandoverReceiptItem[], 
    beneficiaryDispatches: BeneficiaryDispatchRecord[]
  ): Promise<StockCalculationResult> {
    
    // Filter by fuel type
    const fuelHandovers = receivedHandovers.filter(h => h.fuel_type === fuelType);
    const fuelDispatches = beneficiaryDispatches.filter(d => d.fuel_type === fuelType);

    // Calculate total received
    const totalReceived = {
      books: fuelHandovers.reduce((sum, h) => sum + h.total_books, 0),
      coupons: fuelHandovers.reduce((sum, h) => sum + h.total_coupons, 0),
      liters: fuelHandovers.reduce((sum, h) => sum + h.total_liters, 0)
    };

    // Calculate total dispensed to beneficiaries
    const totalDispensed = {
      beneficiaries: fuelDispatches.length,
      coupons: fuelDispatches.reduce((sum, d) => sum + d.coupons_dispatched, 0),
      liters: fuelDispatches.reduce((sum, d) => sum + d.liters_dispatched, 0)
    };

    // Calculate available stock (what we received minus what we dispensed)
    const availableStock = {
      books: Math.max(0, totalReceived.books), // Books don't decrease with individual coupon use
      coupons: Math.max(0, totalReceived.coupons - totalDispensed.coupons),
      liters: Math.max(0, totalReceived.liters - totalDispensed.liters)
    };

    // Reconciliation check
    const expectedRemainingLiters = totalReceived.liters - totalDispensed.liters;
    const discrepancy = Math.abs(availableStock.liters - expectedRemainingLiters);
    const isBalanced = discrepancy < 0.01; // Allow for small floating point errors

    return {
      fuelType,
      totalReceived,
      totalDispensed,
      availableStock,
      reconciliation: {
        isBalanced,
        discrepancy,
        lastReconciled: dayjs().toISOString()
      }
    };
  }

  /**
   * Extract book information from dispatch data
   */
  private extractBookInfo(books: any[]): BookReceiptInfo[] {
    return books.map((book: any) => ({
      id: book.id,
      book_number: book.book_number || `BOOK-${book.id}`,
      coupon_amount: book.coupon_amount || (book.fuel_type === 'PETROL' ? 20 : 5),
      total_coupons: book.total_coupons || 20,
      first_coupon_serial: book.first_coupon_serial || `${book.fuel_type}-${book.id}-001`,
      last_coupon_serial: book.last_coupon_serial || `${book.fuel_type}-${book.id}-020`,
      fuel_type: book.fuel_type || 'PETROL',
      total_liters: book.total_liters || (book.total_coupons || 20) * (book.coupon_amount || 20)
    }));
  }

  /**
   * Calculate total coupons from books
   */
  private calculateTotalCoupons(books: any[]): number {
    return books.reduce((sum, book) => sum + (book.total_coupons || 20), 0);
  }

  /**
   * Calculate total liters from books
   */
  private calculateTotalLiters(books: any[]): number {
    return books.reduce((sum, book) => {
      const coupons = book.total_coupons || 20;
      const litersPerCoupon = book.coupon_amount || (book.fuel_type === 'PETROL' ? 20 : 5);
      return sum + (coupons * litersPerCoupon);
    }, 0);
  }

  /**
   * Get subcenter name
   */
  private async getSubCenterName(): Promise<string> {
    try {
      const response = await apiClient.get(`/subcenters/${this.subcenterId}/`);
      return response.data.name || response.data.center_name || 'Unknown SubCenter';
    } catch (error) {
      console.error('Error fetching subcenter name:', error);
      return 'Unknown SubCenter';
    }
  }

  /**
   * Get stock alerts based on thresholds
   */
  async getStockAlerts(): Promise<{
    critical: string[];
    warning: string[];
    info: string[];
  }> {
    const stock = await this.calculateCurrentStock();
    const alerts = {
      critical: [] as string[],
      warning: [] as string[],
      info: [] as string[]
    };

    // Check petrol stock
    if (stock.petrol.availableStock.liters < 100) {
      alerts.critical.push(`Critical: Only ${stock.petrol.availableStock.liters}L petrol remaining`);
    } else if (stock.petrol.availableStock.liters < 500) {
      alerts.warning.push(`Warning: Low petrol stock - ${stock.petrol.availableStock.liters}L remaining`);
    }

    // Check diesel stock
    if (stock.diesel.availableStock.liters < 50) {
      alerts.critical.push(`Critical: Only ${stock.diesel.availableStock.liters}L diesel remaining`);
    } else if (stock.diesel.availableStock.liters < 200) {
      alerts.warning.push(`Warning: Low diesel stock - ${stock.diesel.availableStock.liters}L remaining`);
    }

    // Check reconciliation
    if (!stock.petrol.reconciliation.isBalanced) {
      alerts.warning.push(`Petrol stock reconciliation discrepancy: ${stock.petrol.reconciliation.discrepancy}L`);
    }
    if (!stock.diesel.reconciliation.isBalanced) {
      alerts.warning.push(`Diesel stock reconciliation discrepancy: ${stock.diesel.reconciliation.discrepancy}L`);
    }

    return alerts;
  }

  /**
   * Generate stock movement history
   */
  async getStockMovementHistory(days: number = 30): Promise<any[]> {
    try {
      const endDate = dayjs();
      const startDate = endDate.subtract(days, 'day');

      // Fetch received handovers in date range
      const receivedResponse = await apiClient.get(`/dispatches/`, {
        params: {
          to_center: this.subcenterId,
          status: 'RECEIVED',
          received_date__gte: startDate.format('YYYY-MM-DD'),
          received_date__lte: endDate.format('YYYY-MM-DD')
        }
      });

      // Fetch beneficiary dispatches in date range
      const dispatchResponse = await apiClient.get(`/coupon-dispatches/`, {
        params: {
          subcenter_id: this.subcenterId,
          dispatch_date__gte: startDate.format('YYYY-MM-DD'),
          dispatch_date__lte: endDate.format('YYYY-MM-DD')
        }
      });

      const movements: any[] = [];

      // Add received handovers as positive movements
      (receivedResponse.data.results || []).forEach((handover: any) => {
        movements.push({
          date: handover.received_date,
          type: 'RECEIVED',
          description: `Received from ${handover.from_center?.name || 'Main Center'}`,
          fuel_type: handover.fuel_type,
          liters: handover.total_liters || 0,
          coupons: handover.total_coupons || 0,
          books: handover.total_books || 0,
          movement: 'IN'
        });
      });

      // Add beneficiary dispatches as negative movements
      (dispatchResponse.data.results || []).forEach((dispatch: any) => {
        movements.push({
          date: dispatch.dispatch_date,
          type: 'DISPATCHED',
          description: `Dispatched to ${dispatch.beneficiary?.user?.full_name || 'Beneficiary'}`,
          fuel_type: dispatch.fuel_type,
          liters: -(dispatch.liters_dispatched || 0),
          coupons: -(dispatch.coupons_dispatched || 0),
          books: 0,
          movement: 'OUT'
        });
      });

      return movements.sort((a, b) => dayjs(b.date).unix() - dayjs(a.date).unix());

    } catch (error) {
      console.error('Error fetching stock movement history:', error);
      return [];
    }
  }
}

export default SubCenterStockService;