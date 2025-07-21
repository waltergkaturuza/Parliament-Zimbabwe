from django.core.management.base import BaseCommand
from fuel.models import Coupon
import qrcode
import io
import base64
from barcode import Code128
from barcode.writer import ImageWriter


class Command(BaseCommand):
    help = 'Populate existing coupons with serial numbers, barcodes, and QR codes'

    def handle(self, *args, **options):
        self.stdout.write('Populating coupon codes...')
        
        # Get coupons without serial numbers
        coupons_to_update = Coupon.objects.filter(serial_number__isnull=True)
        total_count = coupons_to_update.count()
        
        if total_count == 0:
            self.stdout.write(
                self.style.SUCCESS('All coupons already have serial numbers!')
            )
            return
        
        self.stdout.write(f'Found {total_count} coupons to update...')
        
        counter = 1
        updated_count = 0
        
        for coupon in coupons_to_update:
            try:
                # Generate unique serial number
                serial_number = f"FC{counter:06d}"
                
                # Generate QR code
                try:
                    qr = qrcode.QRCode(
                        version=1,
                        error_correction=qrcode.constants.ERROR_CORRECT_L,
                        box_size=10,
                        border=4,
                    )
                    qr_data = f"FC:{serial_number}:{coupon.id}:{coupon.litres}L"
                    qr.add_data(qr_data)
                    qr.make(fit=True)
                    
                    qr_img = qr.make_image(fill_color="black", back_color="white")
                    qr_buffer = io.BytesIO()
                    qr_img.save(qr_buffer, format='PNG')
                    qr_code = base64.b64encode(qr_buffer.getvalue()).decode()
                except Exception as e:
                    self.stdout.write(f'QR code generation failed for {serial_number}: {e}')
                    qr_code = f"QR_{serial_number}"
                
                # Generate barcode
                try:
                    barcode_obj = Code128(serial_number, writer=ImageWriter())
                    barcode_buffer = io.BytesIO()
                    barcode_obj.write(barcode_buffer)
                    barcode = base64.b64encode(barcode_buffer.getvalue()).decode()
                except Exception as e:
                    self.stdout.write(f'Barcode generation failed for {serial_number}: {e}')
                    barcode = f"BC_{serial_number}"
                
                # Update coupon
                coupon.serial_number = serial_number
                coupon.qr_code = qr_code
                coupon.barcode = barcode
                coupon.save()
                
                updated_count += 1
                counter += 1
                
                if updated_count % 10 == 0:
                    self.stdout.write(f'Updated {updated_count}/{total_count} coupons...')
                    
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'Failed to update coupon {coupon.id}: {e}')
                )
                counter += 1
                continue
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully updated {updated_count} coupons with serial numbers, barcodes, and QR codes!'
            )
        )
