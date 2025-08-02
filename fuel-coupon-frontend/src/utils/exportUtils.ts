// src/utils/exportUtils.ts
/**
 * Utility functions for handling export, download, and print operations
 */

import { toast } from '../hooks/use-toast';

export interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  filename?: string;
  filters?: Record<string, any>;
}

export interface PrintOptions {
  orientation?: 'portrait' | 'landscape';
  paperSize?: 'A4' | 'letter';
}

/**
 * Base class for handling exports and downloads
 */
export class ExportManager {
  private baseUrl: string;

  constructor(baseUrl: string = process.env.VITE_API_URL || 'http://localhost:8000') {
    this.baseUrl = baseUrl;
  }

  /**
   * Get authentication headers
   */
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('access_token');
    return {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    };
  }

  /**
   * Generic export function
   */
  private async exportData(endpoint: string, options: ExportOptions): Promise<void> {
    try {
      const params = new URLSearchParams({
        format: options.format,
        ...options.filters,
      });

      const response = await fetch(`${this.baseUrl}/api/export/${endpoint}/?${params}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      // Get filename from Content-Disposition header or use provided filename
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = options.filename;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      if (!filename) {
        const extension = options.format === 'excel' ? 'xlsx' : options.format;
        filename = `export_${new Date().toISOString().split('T')[0]}.${extension}`;
      }

      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: `File ${filename} has been downloaded.`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : 'An error occurred during export',
        variant: "destructive",
      });
    }
  }

  /**
   * Export coupons data
   */
  async exportCoupons(options: ExportOptions): Promise<void> {
    return this.exportData('coupons', options);
  }

  /**
   * Export transactions data
   */
  async exportTransactions(options: ExportOptions): Promise<void> {
    return this.exportData('transactions', options);
  }

  /**
   * Export users data
   */
  async exportUsers(options: ExportOptions): Promise<void> {
    return this.exportData('users', options);
  }

  /**
   * Export beneficiaries data
   */
  async exportBeneficiaries(options: ExportOptions): Promise<void> {
    return this.exportData('beneficiaries', options);
  }

  /**
   * Export books data
   */
  async exportBooks(options: ExportOptions): Promise<void> {
    return this.exportData('books', options);
  }

  /**
   * Export dashboard data
   */
  async exportDashboard(options: ExportOptions): Promise<void> {
    return this.exportData('dashboard', options);
  }

  /**
   * Download import template
   */
  async downloadTemplate(type: 'coupons' | 'users' | 'beneficiaries'): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/export/template/?type=${type}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Template download failed: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${type}_import_template.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Template Downloaded",
        description: `${type} import template has been downloaded.`,
      });
    } catch (error) {
      console.error('Template download error:', error);
      toast({
        title: "Download Failed",
        description: error instanceof Error ? error.message : 'An error occurred during template download',
        variant: "destructive",
      });
    }
  }
}

/**
 * Print manager for generating printable documents
 */
export class PrintManager {
  private baseUrl: string;

  constructor(baseUrl: string = process.env.VITE_API_URL || 'http://localhost:8000') {
    this.baseUrl = baseUrl;
  }

  /**
   * Get authentication headers
   */
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('access_token');
    return {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    };
  }

  /**
   * Print a fuel coupon
   */
  async printCoupon(couponId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/print/coupon/`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ coupon_id: couponId }),
      });

      if (!response.ok) {
        throw new Error(`Print failed: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Open in new window for printing
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      } else {
        // Fallback: download the PDF
        const link = document.createElement('a');
        link.href = url;
        link.download = `coupon_${couponId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      window.URL.revokeObjectURL(url);

      toast({
        title: "Print Ready",
        description: "Coupon document is ready for printing.",
      });
    } catch (error) {
      console.error('Print error:', error);
      toast({
        title: "Print Failed",
        description: error instanceof Error ? error.message : 'An error occurred during printing',
        variant: "destructive",
      });
    }
  }

  /**
   * Print handover report
   */
  async printHandoverReport(handoverData: any): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/print/handover/`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(handoverData),
      });

      if (!response.ok) {
        throw new Error(`Print failed: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Open in new window for printing
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      } else {
        // Fallback: download the PDF
        const link = document.createElement('a');
        link.href = url;
        link.download = `handover_report_${handoverData.handover_id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      window.URL.revokeObjectURL(url);

      toast({
        title: "Print Ready",
        description: "Handover report is ready for printing.",
      });
    } catch (error) {
      console.error('Print error:', error);
      toast({
        title: "Print Failed",
        description: error instanceof Error ? error.message : 'An error occurred during printing',
        variant: "destructive",
      });
    }
  }

  /**
   * Print current page content
   */
  printCurrentPage(): void {
    window.print();
  }

  /**
   * Print specific element by ID
   */
  printElement(elementId: string): void {
    const element = document.getElementById(elementId);
    if (!element) {
      toast({
        title: "Print Failed",
        description: "Element not found for printing",
        variant: "destructive",
      });
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: "Print Failed",
        description: "Unable to open print window",
        variant: "destructive",
      });
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Print</title>
          <style>
            body { font-family: Arial, sans-serif; }
            @media print {
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          ${element.innerHTML}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  }
}

/**
 * View manager for handling view operations
 */
export class ViewManager {
  /**
   * View item in modal or new window
   */
  static viewItem(data: any, title: string = "View Details"): void {
    // Create a modal-like view
    const modalContent = document.createElement('div');
    modalContent.innerHTML = `
      <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center;">
        <div style="background: white; padding: 20px; border-radius: 8px; max-width: 800px; max-height: 80vh; overflow-y: auto; position: relative;">
          <button onclick="this.closest('div').remove()" style="position: absolute; top: 10px; right: 10px; background: none; border: none; font-size: 20px; cursor: pointer;">&times;</button>
          <h2>${title}</h2>
          <pre style="white-space: pre-wrap; font-family: monospace; background: #f5f5f5; padding: 10px; border-radius: 4px;">${JSON.stringify(data, null, 2)}</pre>
        </div>
      </div>
    `;
    
    document.body.appendChild(modalContent);
  }

  /**
   * View item in new window
   */
  static viewItemInNewWindow(data: any, title: string = "View Details"): void {
    const newWindow = window.open('', '_blank', 'width=800,height=600');
    if (!newWindow) {
      toast({
        title: "View Failed",
        description: "Unable to open new window",
        variant: "destructive",
      });
      return;
    }

    newWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            pre { background: #f5f5f5; padding: 10px; border-radius: 4px; white-space: pre-wrap; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <pre>${JSON.stringify(data, null, 2)}</pre>
        </body>
      </html>
    `);
    
    newWindow.document.close();
    newWindow.focus();
  }
}

// Create singleton instances
export const exportManager = new ExportManager();
export const printManager = new PrintManager();

// Export types
export type { ExportOptions, PrintOptions };
