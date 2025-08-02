// src/components/ui/export-buttons.tsx
/**
 * Reusable export button components for various data exports
 */

import React, { useState } from 'react';
import { Button } from './button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from './dropdown-menu';
import { 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Printer, 
  Eye,
  Upload,
  File
} from 'lucide-react';
import { exportManager, printManager, ExportOptions } from '../../utils/exportUtils';

interface ExportButtonsProps {
  entityType: 'coupons' | 'transactions' | 'users' | 'beneficiaries' | 'books' | 'dashboard';
  entityId?: string;
  filters?: Record<string, any>;
  showPrint?: boolean;
  showView?: boolean;
  showTemplate?: boolean;
  onView?: () => void;
  className?: string;
}

export const ExportButtons: React.FC<ExportButtonsProps> = ({
  entityType,
  entityId,
  filters = {},
  showPrint = true,
  showView = true,
  showTemplate = false,
  onView,
  className = ""
}) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    setIsExporting(true);
    try {
      const options: ExportOptions = {
        format,
        filters,
        filename: `${entityType}_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : format}`
      };

      switch (entityType) {
        case 'coupons':
          await exportManager.exportCoupons(options);
          break;
        case 'transactions':
          await exportManager.exportTransactions(options);
          break;
        case 'users':
          await exportManager.exportUsers(options);
          break;
        case 'beneficiaries':
          await exportManager.exportBeneficiaries(options);
          break;
        case 'books':
          await exportManager.exportBooks(options);
          break;
        case 'dashboard':
          await exportManager.exportDashboard(options);
          break;
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = async () => {
    if (entityType === 'coupons' && entityId) {
      await printManager.printCoupon(entityId);
    } else {
      printManager.printCurrentPage();
    }
  };

  const handleDownloadTemplate = async () => {
    if (entityType === 'coupons' || entityType === 'users' || entityType === 'beneficiaries') {
      await exportManager.downloadTemplate(entityType);
    }
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      {/* Export Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={isExporting}>
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? 'Exporting...' : 'Export'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => handleExport('csv')}>
            <FileText className="h-4 w-4 mr-2" />
            Export as CSV
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport('excel')}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export as Excel
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport('pdf')}>
            <FileText className="h-4 w-4 mr-2" />
            Export as PDF
          </DropdownMenuItem>
          
          {showTemplate && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDownloadTemplate}>
                <Upload className="h-4 w-4 mr-2" />
                Download Template
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Print Button */}
      {showPrint && (
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" />
          Print
        </Button>
      )}

      {/* View Button */}
      {showView && onView && (
        <Button variant="outline" size="sm" onClick={onView}>
          <Eye className="h-4 w-4 mr-2" />
          View
        </Button>
      )}
    </div>
  );
};

interface QuickExportButtonProps {
  entityType: 'coupons' | 'transactions' | 'users' | 'beneficiaries' | 'books' | 'dashboard';
  format: 'csv' | 'excel' | 'pdf';
  filters?: Record<string, any>;
  children?: React.ReactNode;
  className?: string;
}

export const QuickExportButton: React.FC<QuickExportButtonProps> = ({
  entityType,
  format,
  filters = {},
  children,
  className = ""
}) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const options: ExportOptions = {
        format,
        filters,
        filename: `${entityType}_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : format}`
      };

      switch (entityType) {
        case 'coupons':
          await exportManager.exportCoupons(options);
          break;
        case 'transactions':
          await exportManager.exportTransactions(options);
          break;
        case 'users':
          await exportManager.exportUsers(options);
          break;
        case 'beneficiaries':
          await exportManager.exportBeneficiaries(options);
          break;
        case 'books':
          await exportManager.exportBooks(options);
          break;
        case 'dashboard':
          await exportManager.exportDashboard(options);
          break;
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const getIcon = () => {
    switch (format) {
      case 'csv':
        return <FileText className="h-4 w-4 mr-2" />;
      case 'excel':
        return <FileSpreadsheet className="h-4 w-4 mr-2" />;
      case 'pdf':
        return <File className="h-4 w-4 mr-2" />;
      default:
        return <Download className="h-4 w-4 mr-2" />;
    }
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleExport} 
      disabled={isExporting}
      className={className}
    >
      {getIcon()}
      {children || (isExporting ? 'Exporting...' : `Export ${format.toUpperCase()}`)}
    </Button>
  );
};

interface PrintButtonProps {
  entityType?: 'coupon' | 'handover' | 'page';
  entityId?: string;
  entityData?: any;
  className?: string;
  children?: React.ReactNode;
}

export const PrintButton: React.FC<PrintButtonProps> = ({
  entityType = 'page',
  entityId,
  entityData,
  className = "",
  children
}) => {
  const handlePrint = async () => {
    switch (entityType) {
      case 'coupon':
        if (entityId) {
          await printManager.printCoupon(entityId);
        }
        break;
      case 'handover':
        if (entityData) {
          await printManager.printHandoverReport(entityData);
        }
        break;
      case 'page':
      default:
        printManager.printCurrentPage();
        break;
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handlePrint} className={className}>
      <Printer className="h-4 w-4 mr-2" />
      {children || 'Print'}
    </Button>
  );
};

interface ViewButtonProps {
  data: any;
  title?: string;
  newWindow?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const ViewButton: React.FC<ViewButtonProps> = ({
  data,
  title = "View Details",
  newWindow = false,
  className = "",
  children
}) => {
  const handleView = () => {
    if (newWindow) {
      // ViewManager.viewItemInNewWindow(data, title);
      // For now, just open JSON in new window
      const newWin = window.open('', '_blank');
      if (newWin) {
        newWin.document.write(`
          <html>
            <head><title>${title}</title></head>
            <body>
              <h1>${title}</h1>
              <pre>${JSON.stringify(data, null, 2)}</pre>
            </body>
          </html>
        `);
        newWin.document.close();
      }
    } else {
      // For now, just log to console or you can implement a modal
      console.log(title, data);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleView} className={className}>
      <Eye className="h-4 w-4 mr-2" />
      {children || 'View'}
    </Button>
  );
};
