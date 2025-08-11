# Box Field Mapping Comparison Analysis

## Frontend Box Receipt Interface vs Django Model vs Serializers

### Summary of Field Mapping Issues Found:

| **Field Category** | **Frontend (BoxReceiptManagement.tsx)** | **Django Model (Box)** | **Serializer (BoxSerializer)** | **Status** |
|-------------------|------------------------------------------|-------------------------|--------------------------------|------------|
| **Basic Identification** |
| Box ID | `boxId: string` | `box_code: CharField` | ✅ `boxId` → `box_code` | **MAPPED** |
| Barcode | `barcode: string` | `barcode: CharField` | ✅ Direct mapping | **MAPPED** |
| Supplier | `supplier: string` | ❌ **MISSING** | ❌ **MISSING** | **🚨 MISSING** |
| **Fuel Information** |
| Fuel Type | `fuelType: 'PETROL' \| 'DIESEL'` | `fuel_type: CharField` | ✅ `fuelType` → `fuel_type` | **MAPPED** |
| Coupon Amount | `couponAmount: number` | `denomination: IntegerField` | ✅ `couponAmount` → `denomination` | **MAPPED** |
| **Structure & Counting** |
| Number of Books | `numberOfBooks: number` | `number_of_books: IntegerField` | ✅ `numberOfBooks` → `number_of_books` | **MAPPED** |
| Coupons Per Book | `couponsPerBook: number` | `coupons_per_book: IntegerField` | ✅ `couponsPerBook` → `coupons_per_book` | **MAPPED** |
| Total Coupons | `totalCoupons: number` | `total_coupons_calculated: IntegerField` | ✅ `total_coupons` → write-only | **MAPPED** |
| Total Litres | `totalLitres: number` | `total_litres: DecimalField` | ✅ `totalLitres` → `total_litres` | **MAPPED** |
| **Coupon Serial Numbers** |
| First Coupon ID | `firstCouponId: string` | `first_coupon_number: CharField` | ✅ `firstCouponId` → `first_coupon_number` | **MAPPED** |
| Last Coupon ID | `lastCouponId: string` | `last_coupon_number: CharField` | ✅ `lastCouponId` → `last_coupon_number` | **MAPPED** |
| **Financial Information** |
| Monetary Value USD | `monetaryValueUSD: number` | `total_value_usd: DecimalField` | ✅ `monetaryValueUSD` → write-only | **MAPPED** |
| Fuel Price Per Litre USD | `fuelPricePerLitreUSD: number` | `fuel_price_per_litre_usd: DecimalField` | ✅ `fuelPriceUSD` → mapped | **MAPPED** |
| Exchange Rate | `exchangeRate?: number` | `exchange_rate_zwg_usd: DecimalField` | ✅ `exchange_rate` → write-only | **MAPPED** |
| **Receipt & Processing** |
| Received Date | `receivedDate: string` | `received_at: DateTimeField` | ✅ `received_at` | **PARTIAL** |
| Received Time | `receivedTime: string` | ❌ **MISSING** (part of received_at) | ❌ **MISSING** | **🚨 SPLIT ISSUE** |
| Received By | `receivedBy: string` | `received_by: ForeignKey(User)` | ✅ `received_by_details` | **PARTIAL** |
| Received By Signature | `receivedBySignature?: string` | ❌ **MISSING** | ❌ **MISSING** | **🚨 MISSING** |
| **Status & Workflow** |
| Status | `status: 'PENDING' \| 'RECEIVED' \| 'VERIFIED' \| 'DISPATCHED' \| 'DAMAGED' \| 'ARCHIVED'` | `status: CharField` (RECEIVED, VERIFIED, DISTRIBUTED, ARCHIVED) | ✅ `status` | **MISMATCH** |
| **Verification & Quality** |
| Verification Notes | `verificationNotes?: string` | `verification_notes: TextField` | ✅ Direct mapping | **MAPPED** |
| Damage Report | `damageReport?: string` | ❌ **MISSING** | ❌ **MISSING** | **🚨 MISSING** |
| **Documentation** |
| Delivery Note | `deliveryNote?: string` | ❌ **MISSING** | ❌ **MISSING** | **🚨 MISSING** |
| Invoice Number | `invoiceNumber?: string` | ❌ **MISSING** | ❌ **MISSING** | **🚨 MISSING** |
| Notes | `notes?: string` | `notes: TextField` | ✅ Direct mapping | **MAPPED** |
| QR Code Data | `qrCodeData?: string` | ❌ **MISSING** | ❌ **MISSING** | **🚨 MISSING** |
| **Legacy Compatibility** |
| Monetary Value (ZWG) | `monetaryValue?: number` | `total_value_zwg: DecimalField` | ❌ **MISSING** | **PARTIAL** |
| Fuel Price Per Litre (ZWG) | `fuelPricePerLitre?: number` | ❌ **MISSING** (deprecated) | ❌ **MISSING** | **DEPRECATED** |
| **Generated Data** |
| Books Generated | `booksGenerated?: BookInfo[]` | `book_details_json: JSONField` | ✅ `book_details` → write-only | **MAPPED** |

## Critical Issues Found:

### 🚨 **Missing Backend Fields (Frontend → Backend):**
1. **`supplier`** - Frontend expects supplier information but model doesn't store it
2. **`receivedBySignature`** - Digital signature field missing from model
3. **`damageReport`** - Damage reporting functionality missing from model
4. **`deliveryNote`** - Delivery documentation missing from model
5. **`invoiceNumber`** - Invoice tracking missing from model
6. **`qrCodeData`** - QR code storage missing from model

### 🚨 **Status Value Mismatches:**
- **Frontend**: `'PENDING' | 'RECEIVED' | 'VERIFIED' | 'DISPATCHED' | 'DAMAGED' | 'ARCHIVED'`
- **Backend**: `'RECEIVED' | 'VERIFIED' | 'DISTRIBUTED' | 'ARCHIVED'`
- Missing: `PENDING`, `DISPATCHED`, `DAMAGED`
- Mismatch: `DISPATCHED` vs `DISTRIBUTED`

### 🚨 **Date/Time Handling Issues:**
- **Frontend** sends separate `receivedDate` and `receivedTime` fields
- **Backend** expects combined `received_at` datetime field
- **Serializer** needs to merge these fields properly

### ⚠️ **Type Mismatches:**
1. **Received By**: Frontend sends string name, backend expects User foreign key
2. **Date Fields**: Frontend sends strings, backend expects datetime objects

## Recommendations:

### 1. **Add Missing Model Fields:**
```python
# Add to Box model:
supplier = models.CharField(max_length=200, blank=True, null=True)
received_by_signature = models.TextField(blank=True, null=True)  # Digital signature data
damage_report = models.TextField(blank=True, null=True)
delivery_note = models.CharField(max_length=200, blank=True, null=True)
invoice_number = models.CharField(max_length=100, blank=True, null=True)
qr_code_data = models.TextField(blank=True, null=True)
```

### 2. **Fix Status Choices:**
```python
STATUS_CHOICES = [
    ('PENDING', 'Pending Receipt'),
    ('RECEIVED', 'Received'),
    ('VERIFIED', 'Verified'), 
    ('DISPATCHED', 'Dispatched'),  # Instead of DISTRIBUTED
    ('DAMAGED', 'Damaged'),
    ('ARCHIVED', 'Archived'),
]
```

### 3. **Enhance Serializer:**
```python
# Add to BoxSerializer:
supplier = serializers.CharField(required=False, allow_blank=True)
received_by_signature = serializers.CharField(required=False, allow_blank=True)
damage_report = serializers.CharField(required=False, allow_blank=True)
delivery_note = serializers.CharField(required=False, allow_blank=True)
invoice_number = serializers.CharField(required=False, allow_blank=True)
qr_code_data = serializers.CharField(required=False, allow_blank=True)

# Handle date/time combination:
def validate(self, data):
    received_date = data.pop('receivedDate', None)
    received_time = data.pop('receivedTime', None)
    if received_date and received_time:
        # Combine date and time into received_at
        data['received_at'] = f"{received_date} {received_time}"
    return data
```

### 4. **Frontend Type Definitions:**
Update `src/types/models.ts` and `src/types/index.ts` to match backend fields exactly.

This analysis shows significant gaps between frontend expectations and backend implementation that need to be addressed for full functionality.
