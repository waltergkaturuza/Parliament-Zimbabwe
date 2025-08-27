# fuel/services/pdf.py
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.graphics.barcode import code128, qr
from reportlab.graphics.shapes import Drawing
from django.conf import settings
from django.http import HttpResponse
from django.template.loader import render_to_string
from io import BytesIO
import qrcode
import json
from datetime import datetime


class PDFGenerator:
    """Service for generating various PDF documents"""
    
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self.title_style = ParagraphStyle(
            'CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=16,
            spaceAfter=30,
            alignment=1,  # Center alignment
        )
        self.header_style = ParagraphStyle(
            'CustomHeader',
            parent=self.styles['Heading2'],
            fontSize=12,
            spaceAfter=12,
        )
    
    def generate_coupon_pdf(self, coupons, title="Fuel Coupons"):
        """Generate PDF for fuel coupons with barcodes and QR codes"""
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        story = []
        
        # Title
        story.append(Paragraph(title, self.title_style))
        story.append(Spacer(1, 12))
        
        # Create table data
        data = [['Coupon Number', 'Serial Number', 'Litres', 'Status', 'Barcode', 'QR Code']]
        
        for coupon in coupons:
            # Generate barcode
            barcode_drawing = Drawing(100, 30)
            barcode = code128.Code128(coupon.barcode, barWidth=0.8, barHeight=20)
            barcode.drawOn(barcode_drawing, 0, 0)
            
            # Generate QR code
            qr_code_img = qrcode.make(coupon.qr_code, box_size=3, border=1)
            qr_buffer = BytesIO()
            qr_code_img.save(qr_buffer, format='PNG')
            qr_buffer.seek(0)
            
            row = [
                coupon.coupon_number,
                coupon.serial_number,
                f"{coupon.litres}L",
                coupon.get_status_display(),
                barcode_drawing,
                f"QR: {coupon.serial_number}"  # Simplified for PDF
            ]
            data.append(row)
        
        # Create table
        table = Table(data, colWidths=[1.5*inch, 1.2*inch, 0.8*inch, 1*inch, 1.5*inch, 1*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        story.append(table)
        doc.build(story)
        
        buffer.seek(0)
        return buffer
    
    def generate_handover_receipt(self, handover):
        """Generate handover receipt PDF"""
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        story = []
        
        # Header
        story.append(Paragraph("PARLIAMENT OF ZIMBABWE", self.title_style))
        story.append(Paragraph("Fuel Coupon Handover Receipt", self.header_style))
        story.append(Spacer(1, 12))
        
        # Handover details
        details_data = [
            ['Handover ID:', str(handover.id)],
            ['Date:', handover.handover_date.strftime('%Y-%m-%d %H:%M')],
            ['From:', handover.from_user.get_full_name()],
            ['To:', handover.to_user.get_full_name()],
            ['Status:', handover.get_status_display()],
        ]
        
        if handover.witness:
            details_data.append(['Witness:', handover.witness.get_full_name()])
        
        if handover.confirmation_date:
            details_data.append(['Confirmed:', handover.confirmation_date.strftime('%Y-%m-%d %H:%M')])
        
        details_table = Table(details_data, colWidths=[2*inch, 4*inch])
        details_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        
        story.append(details_table)
        story.append(Spacer(1, 20))
        
        # Items being handed over
        story.append(Paragraph("Items Handed Over:", self.header_style))
        
        if handover.coupon:
            item_data = [
                ['Type:', 'Coupon'],
                ['Coupon Number:', handover.coupon.coupon_number],
                ['Litres:', f"{handover.coupon.litres}L"],
                ['Status:', handover.coupon.get_status_display()],
            ]
        elif handover.book:
            item_data = [
                ['Type:', 'Book'],
                ['Book Number:', handover.book.book_number],
                ['Box:', handover.book.box.box_code],
                ['Total Coupons:', str(handover.book.total_coupons)],
            ]
        elif handover.box:
            item_data = [
                ['Type:', 'Box'],
                ['Box Code:', handover.box.box_code],
                ['Total Litres:', f"{handover.box.total_litres}L"],
                ['Books Count:', str(handover.box.books.count())],
            ]
        else:
            item_data = [['Type:', 'Unknown']]
        
        item_table = Table(item_data, colWidths=[2*inch, 4*inch])
        item_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        
        story.append(item_table)
        story.append(Spacer(1, 30))
        
        # Signatures
        signature_data = [
            ['From (Signature):', '_' * 30, 'To (Signature):', '_' * 30],
            ['', '', '', ''],
            ['Print Name:', handover.from_user.get_full_name(), 'Print Name:', handover.to_user.get_full_name()],
            ['Date:', '_' * 20, 'Date:', '_' * 20],
        ]
        
        if handover.witness:
            signature_data.extend([
                ['', '', '', ''],
                ['Witness (Signature):', '_' * 30, '', ''],
                ['Print Name:', handover.witness.get_full_name(), '', ''],
            ])
        
        signature_table = Table(signature_data, colWidths=[1.5*inch, 2.5*inch, 1.5*inch, 2.5*inch])
        signature_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
        ]))
        
        story.append(signature_table)
        
        if handover.notes:
            story.append(Spacer(1, 20))
            story.append(Paragraph("Notes:", self.header_style))
            story.append(Paragraph(handover.notes, self.styles['Normal']))
        
        doc.build(story)
        buffer.seek(0)
        return buffer


def create_coupon_pdf_response(coupons, filename="fuel_coupons.pdf"):
    """Create HTTP response with coupon PDF"""
    generator = PDFGenerator()
    pdf_buffer = generator.generate_coupon_pdf(coupons)
    
    response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    return response


def create_handover_receipt_response(handover, filename=None):
    """Create HTTP response with handover receipt PDF"""
    if not filename:
        filename = f"handover_receipt_{handover.id}.pdf"
    
    generator = PDFGenerator()
    pdf_buffer = generator.generate_handover_receipt(handover)
    
    response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    return response
