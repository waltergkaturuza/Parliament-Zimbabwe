// src/utils/pdfGenerator.ts
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export function generateCouponPDF(coupons: any[], title: string) {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(18);
  doc.text(title, 14, 20);
  
  // Table
  autoTable(doc, {
    head: [['Number', 'Status', 'Litres', 'Allocated To']],
    body: coupons.map(c => [
      c.coupon_number,
      c.status,
      c.litres,
      c.allocated_to?.username || 'N/A'
    ]),
    startY: 30,
  });
  
  doc.save(`coupons-report-${new Date().toISOString().slice(0, 10)}.pdf`);
}