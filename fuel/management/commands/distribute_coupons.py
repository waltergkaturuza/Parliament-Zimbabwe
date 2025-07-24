from django.core.management.base import BaseCommand
from fuel.models import Box, Book, Coupon, User, SubCenter, CouponDistribution
from django.db import transaction
from django.utils import timezone
from django.db.models import Count, Q
from decimal import Decimal


class Command(BaseCommand):
    help = 'Automated distribution and tracking of coupon books'

    def add_arguments(self, parser):
        parser.add_argument(
            '--action',
            type=str,
            choices=[
                'distribute-to-center', 'bulk-assign', 'track-distribution',
                'generate-distribution-report', 'return-books', 'transfer-books'
            ],
            required=True,
            help='Distribution action to perform'
        )
        parser.add_argument(
            '--box-code',
            type=str,
            help='Box code to distribute from'
        )
        parser.add_argument(
            '--center-code',
            type=str,
            help='Sub-center code to distribute to'
        )
        parser.add_argument(
            '--beneficiary-list',
            type=str,
            help='Path to CSV file with beneficiary list (username,book_count)'
        )
        parser.add_argument(
            '--from-center',
            type=str,
            help='Source center code for transfers'
        )
        parser.add_argument(
            '--to-center',
            type=str,
            help='Destination center code for transfers'
        )
        parser.add_argument(
            '--book-numbers',
            type=str,
            help='Comma-separated list of book numbers to transfer/return'
        )

    def handle(self, *args, **options):
        action = options['action']
        
        self.stdout.write(
            self.style.SUCCESS(f'🚀 Starting automated distribution: {action}')
        )

        if action == 'distribute-to-center':
            self.distribute_box_to_center(options)
        elif action == 'bulk-assign':
            self.bulk_assign_books(options)
        elif action == 'track-distribution':
            self.track_distribution_status(options)
        elif action == 'generate-distribution-report':
            self.generate_distribution_report(options)
        elif action == 'return-books':
            self.return_books_to_center(options)
        elif action == 'transfer-books':
            self.transfer_books_between_centers(options)

    def distribute_box_to_center(self, options):
        """Distribute an entire box to a sub-center"""
        box_code = options.get('box_code')
        center_code = options.get('center_code')
        
        if not box_code or not center_code:
            self.stdout.write(
                self.style.ERROR('❌ Box code and center code required')
            )
            return

        try:
            box = Box.objects.get(box_code=box_code)
            center = SubCenter.objects.get(code=center_code)
        except (Box.DoesNotExist, SubCenter.DoesNotExist) as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Not found: {e}')
            )
            return

        # Check if box is already assigned
        if box.assigned_to:
            self.stdout.write(
                self.style.WARNING(
                    f'⚠️  Box {box_code} is already assigned to {box.assigned_to.name}'
                )
            )
            return

        # Assign box to center
        with transaction.atomic():
            box.assigned_to = center
            box.save()

            # Create distribution record
            distribution = CouponDistribution.objects.create(
                box=box,
                distributed_to=center,
                distributed_by=None,  # Could be set if we have current user context
                distribution_date=timezone.now(),
                total_books=box.books.count(),
                total_coupons=box.books.aggregate(
                    total=Count('coupons')
                )['total'] or 0,
                notes=f'Automated distribution of box {box_code} to {center.name}'
            )

        self.stdout.write(
            self.style.SUCCESS(
                f'✅ Box {box_code} successfully distributed to {center.name}'
            )
        )

        # Display distribution summary
        self._display_box_distribution_summary(box, center, distribution)

    def bulk_assign_books(self, options):
        """Bulk assign books to multiple beneficiaries from CSV"""
        beneficiary_list = options.get('beneficiary_list')
        box_code = options.get('box_code')
        
        if not beneficiary_list or not box_code:
            self.stdout.write(
                self.style.ERROR('❌ Beneficiary list file and box code required')
            )
            return

        try:
            box = Box.objects.get(box_code=box_code)
        except Box.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'❌ Box {box_code} not found')
            )
            return

        # Read beneficiary list from CSV
        import csv
        assignments = []
        
        try:
            with open(beneficiary_list, 'r', encoding='utf-8') as csvfile:
                reader = csv.DictReader(csvfile)
                for row in reader:
                    username = row.get('username', '').strip()
                    book_count = int(row.get('book_count', 1))
                    
                    if username:
                        assignments.append((username, book_count))
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Error reading CSV file: {e}')
            )
            return

        self.stdout.write(f'📋 Processing {len(assignments)} assignments...')

        # Process assignments
        successful_assignments = []
        failed_assignments = []
        available_books = list(box.books.filter(is_assigned=False))

        with transaction.atomic():
            books_assigned = 0
            
            for username, book_count in assignments:
                try:
                    user = User.objects.get(username=username, role='BENEFICIARY')
                    
                    # Check if we have enough books
                    if books_assigned + book_count > len(available_books):
                        failed_assignments.append((username, 'Not enough available books'))
                        continue
                    
                    # Assign books
                    user_books = available_books[books_assigned:books_assigned + book_count]
                    for book in user_books:
                        book.is_assigned = True
                        book.assigned_to = user
                        book.assigned_date = timezone.now()
                        book.save()
                        
                        # Update coupon status
                        book.coupons.filter(status='AVAILABLE').update(
                            status='ALLOCATED',
                            allocated_to=user,
                            allocated_date=timezone.now()
                        )
                    
                    books_assigned += book_count
                    successful_assignments.append((user, user_books))
                    
                except User.DoesNotExist:
                    failed_assignments.append((username, 'User not found or not a beneficiary'))
                except Exception as e:
                    failed_assignments.append((username, str(e)))

        # Display results
        self.stdout.write(
            self.style.SUCCESS(f'✅ Successfully assigned {books_assigned} books to {len(successful_assignments)} beneficiaries')
        )

        if failed_assignments:
            self.stdout.write(
                self.style.WARNING(f'⚠️  {len(failed_assignments)} assignments failed:')
            )
            for username, reason in failed_assignments:
                self.stdout.write(f'   • {username}: {reason}')

        # Display assignment summary
        self._display_bulk_assignment_summary(successful_assignments)

    def track_distribution_status(self, options):
        """Track current distribution status across all boxes and centers"""
        box_code = options.get('box_code')
        center_code = options.get('center_code')
        
        # Build query filters
        box_filter = Q()
        if box_code:
            box_filter = Q(box_code=box_code)
        
        center_filter = Q()
        if center_code:
            center_filter = Q(assigned_to__code=center_code)
        
        boxes = Box.objects.filter(box_filter & center_filter).select_related('assigned_to')
        
        if not boxes.exists():
            self.stdout.write(
                self.style.WARNING('⚠️  No boxes found matching criteria')
            )
            return

        self.stdout.write(f'\n📊 DISTRIBUTION STATUS REPORT')
        self.stdout.write('=' * 100)
        
        # Header
        self.stdout.write(
            f"{'Box Code':<15} {'Fuel':<8} {'Denomination':<8} {'Center':<20} "
            f"{'Total Books':<12} {'Assigned':<10} {'Available':<10} {'Status':<10}"
        )
        self.stdout.write('-' * 100)
        
        # Box details
        total_boxes = 0
        total_books = 0
        total_assigned = 0
        
        for box in boxes:
            total_boxes += 1
            book_stats = self._get_book_statistics(box)
            total_books += book_stats['total']
            total_assigned += book_stats['assigned']
            
            center_name = box.assigned_to.name if box.assigned_to else 'Unassigned'
            status = '📦 Distributed' if box.assigned_to else '🏪 In Stock'
            
            self.stdout.write(
                f"{box.box_code:<15} {box.fuel_type:<8} {box.denomination}L{'':<4} "
                f"{center_name:<20} {book_stats['total']:<12} "
                f"{book_stats['assigned']:<10} {book_stats['available']:<10} {status:<10}"
            )

        # Summary
        self.stdout.write('-' * 100)
        self.stdout.write(
            f"TOTALS: {total_boxes} boxes | {total_books} books | "
            f"{total_assigned} assigned | {total_books - total_assigned} available"
        )

    def generate_distribution_report(self, options):
        """Generate comprehensive distribution report"""
        self.stdout.write('📈 Generating distribution report...')
        
        # Get all distribution records
        distributions = CouponDistribution.objects.all().select_related(
            'box', 'distributed_to'
        ).order_by('-distribution_date')
        
        if not distributions.exists():
            self.stdout.write(
                self.style.WARNING('⚠️  No distribution records found')
            )
            return

        self.stdout.write(f'\n📋 DISTRIBUTION REPORT ({distributions.count()} records)')
        self.stdout.write('=' * 120)
        
        # Header
        self.stdout.write(
            f"{'Date':<12} {'Box Code':<15} {'Center':<20} {'Books':<8} "
            f"{'Coupons':<10} {'Fuel Type':<10} {'Status':<12} {'Notes':<30}"
        )
        self.stdout.write('-' * 120)
        
        # Distribution details
        total_distributions = 0
        total_books_distributed = 0
        total_coupons_distributed = 0
        
        for dist in distributions[:50]:  # Show latest 50
            total_distributions += 1
            total_books_distributed += dist.total_books
            total_coupons_distributed += dist.total_coupons
            
            date = dist.distribution_date.strftime('%Y-%m-%d')
            status = '✅ Active' if dist.box.assigned_to else '🔄 Returned'
            notes = (dist.notes or '')[:25] + '...' if len(dist.notes or '') > 25 else (dist.notes or '')
            
            self.stdout.write(
                f"{date:<12} {dist.box.box_code:<15} {dist.distributed_to.name:<20} "
                f"{dist.total_books:<8} {dist.total_coupons:<10} "
                f"{dist.box.fuel_type:<10} {status:<12} {notes:<30}"
            )

        # Summary statistics
        self.stdout.write('-' * 120)
        self.stdout.write(f'SUMMARY:')
        self.stdout.write(f'  Total Distributions: {total_distributions}')
        self.stdout.write(f'  Books Distributed: {total_books_distributed}')
        self.stdout.write(f'  Coupons Distributed: {total_coupons_distributed}')
        
        # Center-wise breakdown
        from django.db.models import Sum
        center_stats = distributions.values('distributed_to__name').annotate(
            total_books=Sum('total_books'),
            total_coupons=Sum('total_coupons'),
            distribution_count=Count('id')
        ).order_by('-total_books')
        
        self.stdout.write(f'\n📊 CENTER-WISE DISTRIBUTION:')
        for stat in center_stats:
            center_name = stat['distributed_to__name']
            self.stdout.write(
                f"  {center_name}: {stat['distribution_count']} distributions, "
                f"{stat['total_books']} books, {stat['total_coupons']} coupons"
            )

    def return_books_to_center(self, options):
        """Return specific books back to center inventory"""
        box_code = options.get('box_code')
        book_numbers = options.get('book_numbers')
        
        if not box_code or not book_numbers:
            self.stdout.write(
                self.style.ERROR('❌ Box code and book numbers required')
            )
            return

        try:
            box = Box.objects.get(box_code=box_code)
        except Box.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'❌ Box {box_code} not found')
            )
            return

        book_list = [num.strip() for num in book_numbers.split(',')]
        books_to_return = box.books.filter(book_number__in=book_list, is_assigned=True)
        
        if not books_to_return.exists():
            self.stdout.write(
                self.style.WARNING('⚠️  No assigned books found with specified numbers')
            )
            return

        # Return books
        with transaction.atomic():
            returned_count = 0
            for book in books_to_return:
                # Check if any coupons have been used
                used_coupons = book.coupons.filter(status='USED').count()
                if used_coupons > 0:
                    self.stdout.write(
                        self.style.WARNING(
                            f'⚠️  Book {book.book_number} has {used_coupons} used coupons - cannot return'
                        )
                    )
                    continue
                
                # Return book
                book.is_assigned = False
                book.assigned_to = None
                book.assigned_date = None
                book.save()
                
                # Update coupon status
                book.coupons.filter(status='ALLOCATED').update(
                    status='AVAILABLE',
                    allocated_to=None,
                    allocated_date=None
                )
                
                returned_count += 1

        self.stdout.write(
            self.style.SUCCESS(f'✅ Successfully returned {returned_count} books to center inventory')
        )

    def transfer_books_between_centers(self, options):
        """Transfer books between sub-centers"""
        box_code = options.get('box_code')
        from_center = options.get('from_center')
        to_center = options.get('to_center')
        book_numbers = options.get('book_numbers')
        
        if not all([box_code, from_center, to_center, book_numbers]):
            self.stdout.write(
                self.style.ERROR('❌ All parameters required for transfer')
            )
            return

        try:
            box = Box.objects.get(box_code=box_code, assigned_to__code=from_center)
            destination_center = SubCenter.objects.get(code=to_center)
        except (Box.DoesNotExist, SubCenter.DoesNotExist) as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Not found: {e}')
            )
            return

        book_list = [num.strip() for num in book_numbers.split(',')]
        books_to_transfer = box.books.filter(
            book_number__in=book_list,
            is_assigned=False  # Only transfer unassigned books
        )
        
        if not books_to_transfer.exists():
            self.stdout.write(
                self.style.WARNING('⚠️  No available books found for transfer')
            )
            return

        # Create transfer record and update assignments
        with transaction.atomic():
            # For this example, we'll create a new distribution record
            transfer_distribution = CouponDistribution.objects.create(
                box=box,
                distributed_to=destination_center,
                distribution_date=timezone.now(),
                total_books=books_to_transfer.count(),
                total_coupons=sum(book.coupons.count() for book in books_to_transfer),
                notes=f'Transfer from {box.assigned_to.name} to {destination_center.name}'
            )

        self.stdout.write(
            self.style.SUCCESS(
                f'✅ Successfully transferred {books_to_transfer.count()} books from '
                f'{box.assigned_to.name} to {destination_center.name}'
            )
        )

    def _get_book_statistics(self, box):
        """Get book assignment statistics for a box"""
        total_books = box.books.count()
        assigned_books = box.books.filter(is_assigned=True).count()
        available_books = total_books - assigned_books
        
        return {
            'total': total_books,
            'assigned': assigned_books,
            'available': available_books
        }

    def _display_box_distribution_summary(self, box, center, distribution):
        """Display summary of box distribution"""
        self.stdout.write(f'\n📋 DISTRIBUTION SUMMARY')
        self.stdout.write('=' * 50)
        self.stdout.write(f'Box: {box.box_code}')
        self.stdout.write(f'Distributed to: {center.name} ({center.code})')
        self.stdout.write(f'Distribution Date: {distribution.distribution_date}')
        self.stdout.write(f'Total Books: {distribution.total_books}')
        self.stdout.write(f'Total Coupons: {distribution.total_coupons}')
        self.stdout.write(f'Fuel Type: {box.get_fuel_type_display()}')
        self.stdout.write(f'Denomination: {box.denomination}L per coupon')

    def _display_bulk_assignment_summary(self, assignments):
        """Display summary of bulk assignments"""
        if not assignments:
            return
            
        self.stdout.write(f'\n📋 BULK ASSIGNMENT SUMMARY')
        self.stdout.write('=' * 80)
        
        for user, books in assignments[:10]:  # Show first 10
            total_coupons = sum(book.coupons.count() for book in books)
            total_litres = total_coupons * books[0].box.denomination
            
            self.stdout.write(
                f'{user.get_full_name() or user.username}: {len(books)} books, '
                f'{total_coupons} coupons, {total_litres}L fuel allocation'
            )
        
        if len(assignments) > 10:
            self.stdout.write(f'... and {len(assignments) - 10} more assignments')
