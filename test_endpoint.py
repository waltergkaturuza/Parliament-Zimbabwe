# Simple test endpoint to debug the issue
from rest_framework.decorators import api_view
from rest_framework.response import Response
from fuel.models import Book

@api_view(['GET'])
def test_books_endpoint(request):
    """Simple test endpoint for debugging"""
    try:
        available_books = Book.objects.filter(
            box__is_received=True,
            is_assigned=False,
        )
        
        books_data = []
        for book in available_books[:5]:
            books_data.append({
                'id': book.id,
                'bookCode': book.book_code or f"BOOK-{book.id}",
                'boxId': book.box.box_code,
                'firstCouponNumber': getattr(book, 'first_coupon_number', None),
                'lastCouponNumber': getattr(book, 'last_coupon_number', None),
                'numberOfCoupons': book.initial_coupon_count or 100,
            })
        
        return Response({
            'results': books_data,
            'count': len(books_data),
            'message': 'Test endpoint working'
        })
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=500)
