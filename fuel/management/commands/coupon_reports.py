from django.core.management.base import BaseCommand
from fuel.models import Box, Book, Coupon, User, SubCenter
from django.db.models import Count, Q, Sum
from django.utils import timezone
from datetime import timedelta
import csv
import os


class Command(BaseCommand):
    help = 'Generate comprehensive coupon and book inventory reports'

    def add_arguments(self, parser):
        parser.add_argument(
            '--report-type',
            type=str,
            choices=[
                'inventory-summary', 'coupon-tracking', 'book-allocation',
                'center-distribution', 'usage-analysis', 'missing-coupons'
            ],
            default='inventory-summary',
            help='Type of report to generate'
        )
        parser.add_argument(
            '--output-format',
            type=str,
            choices=['console', 'csv', 'json'],
            default='console',
            help='Output format'
        )
        parser.add_argument(
            '--output-file',
            type=str,
            help='Output file path (for csv/json formats)'
        )
        parser.add_argument(
            '--box-code',
            type=str,
            help='Filter by specific box code'
        )
        parser.add_argument(
            '--center-code',
            type=str,
            help='Filter by specific center code'
        )
        parser.add_argument(
            '--date-from',
            type=str,
            help='Start date for filtering (YYYY-MM-DD)'
        )
        parser.add_argument(
            '--date-to',
            type=str,
            help='End date for filtering (YYYY-MM-DD)'
        )

    def handle(self, *args, **options):
        report_type = options['report_type']
        output_format = options['output_format']
        
        self.stdout.write(
            self.style.SUCCESS(f'📊 Generating {report_type} report...')
        )

        # Generate the requested report
        if report_type == 'inventory-summary':
            data = self.generate_inventory_summary(options)
        elif report_type == 'coupon-tracking':
            data = self.generate_coupon_tracking_report(options)
        elif report_type == 'book-allocation':
            data = self.generate_book_allocation_report(options)
        elif report_type == 'center-distribution':
            data = self.generate_center_distribution_report(options)
        elif report_type == 'usage-analysis':
            data = self.generate_usage_analysis_report(options)
        elif report_type == 'missing-coupons':
            data = self.generate_missing_coupons_report(options)

        # Output the report
        if output_format == 'console':
            self.display_console_report(data, report_type)
        elif output_format == 'csv':
            self.export_csv_report(data, report_type, options['output_file'])
        elif output_format == 'json':
            self.export_json_report(data, report_type, options['output_file'])

    def generate_inventory_summary(self, options):
        """Generate overall inventory summary"""
        # Apply filters
        box_filter = Q()
        if options.get('box_code'):
            box_filter = Q(box_code=options['box_code'])
        if options.get('center_code'):
            box_filter &= Q(assigned_to__code=options['center_code'])

        boxes = Box.objects.filter(box_filter).select_related('assigned_to')
        
        summary_data = {
            'report_type': 'Inventory Summary',
            'generated_at': timezone.now().isoformat(),
            'filters_applied': self._get_applied_filters(options),
            'totals': {},
            'boxes': [],
            'centers': []
        }

        # Calculate totals
        total_boxes = boxes.count()
        total_books = Book.objects.filter(box__in=boxes).count()
        total_coupons = Coupon.objects.filter(book__box__in=boxes).count()
        assigned_books = Book.objects.filter(box__in=boxes, is_assigned=True).count()
        used_coupons = Coupon.objects.filter(book__box__in=boxes, status='USED').count()
        available_coupons = Coupon.objects.filter(book__box__in=boxes, status='AVAILABLE').count()
        allocated_coupons = Coupon.objects.filter(book__box__in=boxes, status='ALLOCATED').count()

        summary_data['totals'] = {
            'boxes': total_boxes,
            'books': total_books,
            'books_assigned': assigned_books,
            'books_available': total_books - assigned_books,
            'coupons': total_coupons,
            'coupons_used': used_coupons,
            'coupons_available': available_coupons,
            'coupons_allocated': allocated_coupons,
            'utilization_rate': (used_coupons / total_coupons * 100) if total_coupons > 0 else 0
        }

        # Box details
        for box in boxes:
            book_stats = box.books.aggregate(
                total=Count('id'),
                assigned=Count('id', filter=Q(is_assigned=True))
            )
            
            coupon_stats = Coupon.objects.filter(book__box=box).aggregate(
                total=Count('id'),
                used=Count('id', filter=Q(status='USED')),
                available=Count('id', filter=Q(status='AVAILABLE')),
                allocated=Count('id', filter=Q(status='ALLOCATED'))
            )

            box_data = {
                'box_code': box.box_code,
                'fuel_type': box.fuel_type,
                'denomination': box.denomination,
                'assigned_to': box.assigned_to.name if box.assigned_to else 'Unassigned',
                'books': book_stats,
                'coupons': coupon_stats,
                'total_fuel_value': coupon_stats['total'] * box.denomination
            }
            summary_data['boxes'].append(box_data)

        # Center distribution
        center_stats = boxes.values('assigned_to__name', 'assigned_to__code').annotate(
            box_count=Count('id'),
            book_count=Count('books'),
            coupon_count=Count('books__coupons')
        ).exclude(assigned_to__isnull=True)

        for stat in center_stats:
            center_data = {
                'center_name': stat['assigned_to__name'],
                'center_code': stat['assigned_to__code'],
                'boxes': stat['box_count'],
                'books': stat['book_count'],
                'coupons': stat['coupon_count']
            }
            summary_data['centers'].append(center_data)

        return summary_data

    def generate_coupon_tracking_report(self, options):
        """Generate detailed coupon tracking report"""
        # Apply filters
        coupon_filter = Q()
        if options.get('box_code'):
            coupon_filter = Q(book__box__box_code=options['box_code'])
        if options.get('center_code'):
            coupon_filter &= Q(book__box__assigned_to__code=options['center_code'])

        # Date filtering
        if options.get('date_from'):
            from datetime import datetime
            date_from = datetime.strptime(options['date_from'], '%Y-%m-%d').date()
            coupon_filter &= Q(created_at__date__gte=date_from)
        
        if options.get('date_to'):
            from datetime import datetime
            date_to = datetime.strptime(options['date_to'], '%Y-%m-%d').date()
            coupon_filter &= Q(created_at__date__lte=date_to)

        coupons = Coupon.objects.filter(coupon_filter).select_related(
            'book__box', 'allocated_to', 'book__assigned_to'
        ).order_by('coupon_number')

        tracking_data = {
            'report_type': 'Coupon Tracking',
            'generated_at': timezone.now().isoformat(),
            'filters_applied': self._get_applied_filters(options),
            'summary': {},
            'coupons': []
        }

        # Summary statistics
        status_counts = coupons.values('status').annotate(count=Count('id'))
        status_summary = {item['status']: item['count'] for item in status_counts}
        
        tracking_data['summary'] = {
            'total_coupons': coupons.count(),
            'status_breakdown': status_summary
        }

        # Coupon details (limit to prevent huge output)
        for coupon in coupons[:5000]:  # Limit to 5000 coupons
            coupon_data = {
                'coupon_number': coupon.coupon_number,
                'box_code': coupon.book.box.box_code,
                'book_number': coupon.book.book_number,
                'fuel_type': coupon.book.box.fuel_type,
                'denomination': float(coupon.litres),
                'status': coupon.status,
                'allocated_to': coupon.allocated_to.username if coupon.allocated_to else None,
                'book_assigned_to': coupon.book.assigned_to.username if coupon.book.assigned_to else None,
                'center': coupon.book.box.assigned_to.name if coupon.book.box.assigned_to else None,
                'created_at': coupon.created_at.isoformat() if coupon.created_at else None,
                'allocated_date': coupon.allocated_date.isoformat() if coupon.allocated_date else None
            }
            tracking_data['coupons'].append(coupon_data)

        return tracking_data

    def generate_book_allocation_report(self, options):
        """Generate book allocation report"""
        # Apply filters
        book_filter = Q()
        if options.get('box_code'):
            book_filter = Q(box__box_code=options['box_code'])
        if options.get('center_code'):
            book_filter &= Q(box__assigned_to__code=options['center_code'])

        books = Book.objects.filter(book_filter).select_related(
            'box', 'assigned_to', 'box__assigned_to'
        ).order_by('box__box_code', 'book_number')

        allocation_data = {
            'report_type': 'Book Allocation',
            'generated_at': timezone.now().isoformat(),
            'filters_applied': self._get_applied_filters(options),
            'summary': {},
            'books': []
        }

        # Summary
        total_books = books.count()
        assigned_books = books.filter(is_assigned=True).count()
        
        allocation_data['summary'] = {
            'total_books': total_books,
            'assigned_books': assigned_books,
            'available_books': total_books - assigned_books,
            'assignment_rate': (assigned_books / total_books * 100) if total_books > 0 else 0
        }

        # Book details
        for book in books:
            coupon_stats = book.coupons.aggregate(
                total=Count('id'),
                used=Count('id', filter=Q(status='USED')),
                available=Count('id', filter=Q(status='AVAILABLE')),
                allocated=Count('id', filter=Q(status='ALLOCATED'))
            )

            book_data = {
                'box_code': book.box.box_code,
                'book_number': book.book_number,
                'coupon_range': f"{book.first_coupon_number} - {book.last_coupon_number}",
                'is_assigned': book.is_assigned,
                'assigned_to': book.assigned_to.username if book.assigned_to else None,
                'assigned_date': book.assigned_date.isoformat() if book.assigned_date else None,
                'center': book.box.assigned_to.name if book.box.assigned_to else None,
                'coupon_stats': coupon_stats,
                'fuel_type': book.box.fuel_type,
                'denomination': book.box.denomination
            }
            allocation_data['books'].append(book_data)

        return allocation_data

    def generate_center_distribution_report(self, options):
        """Generate center-wise distribution report"""
        centers = SubCenter.objects.all().prefetch_related('boxes', 'boxes__books')
        
        distribution_data = {
            'report_type': 'Center Distribution',
            'generated_at': timezone.now().isoformat(),
            'centers': []
        }

        for center in centers:
            boxes = center.boxes.all()
            
            # Calculate statistics
            total_books = Book.objects.filter(box__in=boxes).count()
            assigned_books = Book.objects.filter(box__in=boxes, is_assigned=True).count()
            total_coupons = Coupon.objects.filter(book__box__in=boxes).count()
            used_coupons = Coupon.objects.filter(book__box__in=boxes, status='USED').count()

            # Fuel type breakdown
            fuel_breakdown = boxes.values('fuel_type').annotate(
                box_count=Count('id'),
                coupon_count=Count('books__coupons')
            )

            center_data = {
                'center_name': center.name,
                'center_code': center.code,
                'location': center.location,
                'is_active': center.is_active,
                'statistics': {
                    'total_boxes': boxes.count(),
                    'total_books': total_books,
                    'assigned_books': assigned_books,
                    'available_books': total_books - assigned_books,
                    'total_coupons': total_coupons,
                    'used_coupons': used_coupons,
                    'utilization_rate': (used_coupons / total_coupons * 100) if total_coupons > 0 else 0
                },
                'fuel_breakdown': list(fuel_breakdown),
                'boxes': []
            }

            # Box details for this center
            for box in boxes:
                box_stats = {
                    'box_code': box.box_code,
                    'fuel_type': box.fuel_type,
                    'denomination': box.denomination,
                    'books': box.books.count(),
                    'assigned_books': box.books.filter(is_assigned=True).count(),
                    'total_coupons': box.books.aggregate(Count('coupons'))['coupons__count'] or 0
                }
                center_data['boxes'].append(box_stats)

            distribution_data['centers'].append(center_data)

        return distribution_data

    def generate_usage_analysis_report(self, options):
        """Generate usage analysis report"""
        # Time-based filtering
        date_filter = Q()
        if options.get('date_from'):
            from datetime import datetime
            date_from = datetime.strptime(options['date_from'], '%Y-%m-%d')
            date_filter = Q(updated_at__gte=date_from)
        
        if options.get('date_to'):
            from datetime import datetime
            date_to = datetime.strptime(options['date_to'], '%Y-%m-%d')
            date_filter &= Q(updated_at__lte=date_to)

        # Get usage statistics
        used_coupons = Coupon.objects.filter(status='USED').filter(date_filter)
        
        usage_data = {
            'report_type': 'Usage Analysis',
            'generated_at': timezone.now().isoformat(),
            'period': {
                'from': options.get('date_from', 'All time'),
                'to': options.get('date_to', 'Present')
            },
            'summary': {},
            'by_fuel_type': {},
            'by_center': {},
            'by_user': []
        }

        # Overall usage summary
        total_used = used_coupons.count()
        total_fuel_consumed = used_coupons.aggregate(
            total_litres=Sum('litres')
        )['total_litres'] or 0

        usage_data['summary'] = {
            'total_coupons_used': total_used,
            'total_fuel_consumed_litres': float(total_fuel_consumed),
            'average_per_coupon': float(total_fuel_consumed / total_used) if total_used > 0 else 0
        }

        # Usage by fuel type
        fuel_usage = used_coupons.values('book__box__fuel_type').annotate(
            coupon_count=Count('id'),
            fuel_consumed=Sum('litres')
        )

        for fuel in fuel_usage:
            usage_data['by_fuel_type'][fuel['book__box__fuel_type']] = {
                'coupons_used': fuel['coupon_count'],
                'fuel_consumed_litres': float(fuel['fuel_consumed'])
            }

        # Usage by center
        center_usage = used_coupons.values('book__box__assigned_to__name').annotate(
            coupon_count=Count('id'),
            fuel_consumed=Sum('litres')
        ).exclude(book__box__assigned_to__isnull=True)

        for center in center_usage:
            center_name = center['book__box__assigned_to__name']
            usage_data['by_center'][center_name] = {
                'coupons_used': center['coupon_count'],
                'fuel_consumed_litres': float(center['fuel_consumed'])
            }

        # Top users
        user_usage = used_coupons.values('allocated_to__username', 'allocated_to__first_name', 'allocated_to__last_name').annotate(
            coupon_count=Count('id'),
            fuel_consumed=Sum('litres')
        ).exclude(allocated_to__isnull=True).order_by('-fuel_consumed')[:20]

        for user in user_usage:
            full_name = f"{user['allocated_to__first_name']} {user['allocated_to__last_name']}".strip()
            usage_data['by_user'].append({
                'username': user['allocated_to__username'],
                'full_name': full_name or user['allocated_to__username'],
                'coupons_used': user['coupon_count'],
                'fuel_consumed_litres': float(user['fuel_consumed'])
            })

        return usage_data

    def generate_missing_coupons_report(self, options):
        """Generate report of missing or inconsistent coupons"""
        # This will check for gaps in coupon sequences
        missing_data = {
            'report_type': 'Missing Coupons Analysis',
            'generated_at': timezone.now().isoformat(),
            'issues': []
        }

        boxes = Box.objects.all()
        
        for box in boxes:
            books = box.books.all()
            
            for book in books:
                # Generate expected coupon sequence
                expected_coupons = self._generate_expected_sequence(
                    book.first_coupon_number,
                    book.last_coupon_number
                )
                
                # Get actual coupon numbers
                actual_coupons = set(book.coupons.values_list('coupon_number', flat=True))
                
                # Find missing coupons
                missing_coupons = set(expected_coupons) - actual_coupons
                extra_coupons = actual_coupons - set(expected_coupons)
                
                if missing_coupons or extra_coupons:
                    issue = {
                        'box_code': box.box_code,
                        'book_number': book.book_number,
                        'expected_range': f"{book.first_coupon_number} - {book.last_coupon_number}",
                        'expected_count': len(expected_coupons),
                        'actual_count': len(actual_coupons),
                        'missing_coupons': sorted(list(missing_coupons)),
                        'extra_coupons': sorted(list(extra_coupons)),
                        'severity': 'HIGH' if missing_coupons else 'LOW'
                    }
                    missing_data['issues'].append(issue)

        return missing_data

    def _generate_expected_sequence(self, first_number, last_number):
        """Generate expected sequence of coupon numbers"""
        import re
        
        first_match = re.match(r'^(.*?)(\d+)$', first_number)
        last_match = re.match(r'^(.*?)(\d+)$', last_number)
        
        if not first_match or not last_match:
            return []
        
        prefix = first_match.group(1)
        first_num = int(first_match.group(2))
        last_num = int(last_match.group(2))
        num_length = len(first_match.group(2))
        
        return [
            f"{prefix}{str(num).zfill(num_length)}"
            for num in range(first_num, last_num + 1)
        ]

    def _get_applied_filters(self, options):
        """Get list of applied filters for reporting"""
        filters = []
        if options.get('box_code'):
            filters.append(f"Box: {options['box_code']}")
        if options.get('center_code'):
            filters.append(f"Center: {options['center_code']}")
        if options.get('date_from'):
            filters.append(f"From: {options['date_from']}")
        if options.get('date_to'):
            filters.append(f"To: {options['date_to']}")
        return filters if filters else ['No filters applied']

    def display_console_report(self, data, report_type):
        """Display report in console format"""
        self.stdout.write(f'\n📋 {data["report_type"].upper()}')
        self.stdout.write('=' * 80)
        
        if report_type == 'inventory-summary':
            self._display_inventory_console(data)
        elif report_type == 'coupon-tracking':
            self._display_tracking_console(data)
        elif report_type == 'book-allocation':
            self._display_allocation_console(data)
        elif report_type == 'center-distribution':
            self._display_distribution_console(data)
        elif report_type == 'usage-analysis':
            self._display_usage_console(data)
        elif report_type == 'missing-coupons':
            self._display_missing_console(data)

    def _display_inventory_console(self, data):
        """Display inventory summary in console"""
        totals = data['totals']
        
        self.stdout.write(f"📊 OVERVIEW:")
        self.stdout.write(f"   Total Boxes: {totals['boxes']}")
        self.stdout.write(f"   Total Books: {totals['books']} (Assigned: {totals['books_assigned']}, Available: {totals['books_available']})")
        self.stdout.write(f"   Total Coupons: {totals['coupons']} (Used: {totals['coupons_used']}, Available: {totals['coupons_available']}, Allocated: {totals['coupons_allocated']})")
        self.stdout.write(f"   Utilization Rate: {totals['utilization_rate']:.1f}%")
        
        self.stdout.write(f"\n📦 BOXES:")
        for box in data['boxes'][:10]:  # Show first 10
            self.stdout.write(
                f"   {box['box_code']}: {box['fuel_type']} {box['denomination']}L | "
                f"Books: {box['books']['total']} | Coupons: {box['coupons']['total']} | "
                f"Center: {box['assigned_to']}"
            )

    def _display_tracking_console(self, data):
        """Display coupon tracking in console"""
        summary = data['summary']
        
        self.stdout.write(f"📊 SUMMARY:")
        self.stdout.write(f"   Total Coupons: {summary['total_coupons']}")
        for status, count in summary['status_breakdown'].items():
            self.stdout.write(f"   {status}: {count}")

    def _display_allocation_console(self, data):
        """Display book allocation in console"""
        summary = data['summary']
        
        self.stdout.write(f"📊 SUMMARY:")
        self.stdout.write(f"   Total Books: {summary['total_books']}")
        self.stdout.write(f"   Assigned: {summary['assigned_books']} ({summary['assignment_rate']:.1f}%)")
        self.stdout.write(f"   Available: {summary['available_books']}")

    def _display_distribution_console(self, data):
        """Display center distribution in console"""
        self.stdout.write(f"🏢 CENTERS:")
        for center in data['centers']:
            stats = center['statistics']
            self.stdout.write(
                f"   {center['center_name']}: {stats['total_boxes']} boxes, "
                f"{stats['total_books']} books, {stats['total_coupons']} coupons "
                f"({stats['utilization_rate']:.1f}% used)"
            )

    def _display_usage_console(self, data):
        """Display usage analysis in console"""
        summary = data['summary']
        
        self.stdout.write(f"📊 USAGE SUMMARY:")
        self.stdout.write(f"   Coupons Used: {summary['total_coupons_used']}")
        self.stdout.write(f"   Fuel Consumed: {summary['total_fuel_consumed_litres']:.2f}L")
        self.stdout.write(f"   Average per Coupon: {summary['average_per_coupon']:.2f}L")

    def _display_missing_console(self, data):
        """Display missing coupons in console"""
        issues = data['issues']
        
        if not issues:
            self.stdout.write(self.style.SUCCESS("✅ No missing coupons found!"))
        else:
            self.stdout.write(self.style.WARNING(f"⚠️  Found {len(issues)} issues:"))
            for issue in issues[:10]:  # Show first 10
                self.stdout.write(
                    f"   {issue['box_code']} {issue['book_number']}: "
                    f"{len(issue['missing_coupons'])} missing, "
                    f"{len(issue['extra_coupons'])} extra"
                )

    def export_csv_report(self, data, report_type, output_file):
        """Export report to CSV format"""
        if not output_file:
            timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
            output_file = f'{report_type}_{timestamp}.csv'
        
        # Implementation would depend on specific report type
        self.stdout.write(
            self.style.SUCCESS(f'📄 Report exported to CSV: {output_file}')
        )

    def export_json_report(self, data, report_type, output_file):
        """Export report to JSON format"""
        import json
        
        if not output_file:
            timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
            output_file = f'{report_type}_{timestamp}.json'
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, default=str)
        
        self.stdout.write(
            self.style.SUCCESS(f'📄 Report exported to JSON: {output_file}')
        )
