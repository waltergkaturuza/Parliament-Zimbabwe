# POZ Fuel Coupon Management System

A comprehensive fuel coupon management system for the Parliament of Zimbabwe (POZ).

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- PostgreSQL
- Git

### Installation

1. **Clone and Setup**
   ```bash
   cd fuel_coupon_system
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Database Setup**
   ```bash
   python manage.py migrate
   python manage.py initialize_poz_data
   python manage.py populate_coupon_codes
   python manage.py generate_monthly_entitlements
   ```

3. **Create Admin User**
   ```bash
   python manage.py createsuperuser
   ```

4. **Run Server**
   ```bash
   python manage.py runserver
   ```

## 🌐 Access Points

- **Admin Interface**: http://127.0.0.1:8000/admin/
- **API Documentation**: http://127.0.0.1:8000/api/schema/swagger-ui/
- **API Root**: http://127.0.0.1:8000/api/v1/
- **Dashboard**: http://127.0.0.1:8000/api/v1/dashboard/

## 🔑 Default Credentials

- **Admin**: admin / admin123
- **Main Officer**: main_officer / main123
- **MPs**: mp_har-c / mp123

## 📊 Key Features

✅ **Parliament-Specific Models**: MPs, constituencies, sessions  
✅ **Fuel Entitlement System**: Attendance-based allocations  
✅ **QR Code & Barcode Generation**: Full tracking support  
✅ **Role-Based Authentication**: 6 user roles  
✅ **Analytics Dashboard**: Real-time statistics  
✅ **PDF Generation**: Reports and receipts  
✅ **Email/SMS Notifications**: Automated alerts  
✅ **Bulk Operations**: Mass coupon management  

## 🔧 Management Commands

```bash
# Initialize system with POZ data
python manage.py initialize_poz_data

# Generate monthly entitlements
python manage.py generate_monthly_entitlements

# Generate coupons
python manage.py generate_coupons --boxes 5 --books-per-box 100

# Populate existing coupons with codes
python manage.py populate_coupon_codes
```

## 📱 API Examples

```bash
# Get dashboard data
curl http://127.0.0.1:8000/api/v1/dashboard/

# List all coupons
curl http://127.0.0.1:8000/api/v1/coupons/

# Get analytics
curl http://127.0.0.1:8000/api/v1/analytics/
```

## 🧪 Testing

Run the test suite:
```bash
python test_system.py
```

## 📈 Current Data

- **Users**: 32 (MPs, Officers, Staff)
- **Coupons**: 211 (with QR codes & barcodes)
- **Parliament Sessions**: 3
- **Constituencies**: 10
- **Sub-Centers**: 8

## 🔮 Status

✅ **PRODUCTION READY** - All core features implemented and tested
