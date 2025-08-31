# Centralized Book Generation System - SINGLE SOURCE OF TRUTH

## 🔒 CRITICAL SECURITY NOTICE

**ALL BOOK AND COUPON GENERATION MUST GO THROUGH THE BACKEND SERVICE**

This system establishes a **SINGLE SOURCE OF TRUTH** for generating books and coupons to prevent mismatches with real physical PetroTrade coupons.

## ⚠️ STRICT RULES

1. **FRONTEND MUST NEVER GENERATE BOOKS LOCALLY**
2. **ALL GENERATION REQUESTS GO THROUGH API ENDPOINTS**
3. **NO CLIENT-SIDE SERIAL NUMBER GENERATION**
4. **USE ONLY THE CENTRALIZED SERVICE**

## 📋 System Overview

### Components

1. **PetroTrade Serial Generator** (`fuel/utils/petrotrade_serials.py`)
   - Handles the complex PetroTrade serial format: `PU006H1355101`
   - Format: `[A-Z][A-Z][000-999][A-Z][A-Z][0000000-9999999]`
   - Implements proper overflow logic for serial increments

2. **Book Generation Service** (`fuel/services/book_generation.py`)
   - Centralized business logic for book/coupon generation
   - Validation, conflict detection, atomic transactions
   - Single point of control for all generation

3. **API Endpoints** (added to `BookViewSet` and `BoxViewSet`)
   - RESTful APIs for frontend integration
   - Proper permissions and error handling
   - JSON responses with detailed feedback

4. **Management Commands**
   - `generate_box_books` - CLI generation tool
   - `demo_centralized_generation` - Testing and demo

## 🎯 PetroTrade Serial Format

Based on the real coupon book image:

```
PU006H1355101
├─ PU: Leading letters (2 chars)
├─ 006: 3-digit section (000-999)  
├─ H: Check letter (A-Z)
├─ (optional second check letter)
└─ 1355101: 7-digit serial (0000000-9999999)
```

### Overflow Logic

1. **Primary**: Increment 7-digit serial (`1355101` → `1355102`)
2. **Secondary**: When serial reaches `9999999`, reset to `0000000` and increment check letters
3. **Tertiary**: When check letters overflow (`Z` → `A`), increment 3-digit section
4. **Final**: When 3-digit reaches `999`, reset to `000` and increment leading letters

## 📡 API Endpoints

### 1. Box-Level Generation

**POST** `/api/boxes/{id}/generate_books/`

```json
{
  "first_serial": "PU006H1355101",
  "last_serial": "PU006H1356100", 
  "books_per_box": 10,
  "coupons_per_book": 100,
  "force": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully generated 10 books and 1000 coupons",
  "data": {
    "box_id": 1,
    "books_created": 10,
    "coupons_created": 1000,
    "serial_range": {
      "first": "PU006H1355101",
      "last": "PU006H1356100"
    },
    "book_details": [...]
  }
}
```

### 2. Generation Status

**GET** `/api/boxes/{id}/generation_status/`

```json
{
  "box_id": 1,
  "has_books": true,
  "book_count": 10,
  "coupon_count": 1000,
  "is_complete": true,
  "books": [...]
}
```

### 3. Validation (Pre-Generation)

**POST** `/api/books/validate_generation_request/`

```json
{
  "box_id": 1,
  "first_serial": "PU006H1355101",
  "last_serial": "PU006H1356100",
  "books_per_box": 10,
  "coupons_per_book": 100,
  "force": false
}
```

## 🏭 Example: 10-Book Box Generation

Real-world example matching your requirements:

```python
# Box contains 1000 coupons across 10 books
box_first = "PU006H1355101"
box_last = "PU006H1356100"

# Generated book ranges:
# Book  1: PU006H1355101 - PU006H1355200 (100 coupons)
# Book  2: PU006H1355201 - PU006H1355300 (100 coupons)
# Book  3: PU006H1355301 - PU006H1355400 (100 coupons)
# ...
# Book 10: PU006H1356001 - PU006H1356100 (100 coupons)
```

## 🔧 Usage Examples

### CLI Generation

```bash
# Generate books for a box
python manage.py generate_box_books \
    --box-id 1 \
    --first-serial "PU006H1355101" \
    --last-serial "PU006H1356100" \
    --books-per-box 10 \
    --coupons-per-book 100

# Dry run (preview only)
python manage.py generate_box_books \
    --box-id 1 \
    --first-serial "PU006H1355101" \
    --last-serial "PU006H1356100" \
    --books-per-box 10 \
    --coupons-per-book 100 \
    --dry-run

# Force regeneration (overwrites existing)
python manage.py generate_box_books \
    --box-id 1 \
    --first-serial "PU006H1355101" \
    --last-serial "PU006H1356100" \
    --books-per-box 10 \
    --coupons-per-book 100 \
    --force
```

### Demo Commands

```bash
# Run full system demo
python manage.py demo_centralized_generation --demo-type full-box

# Test validation only
python manage.py demo_centralized_generation --demo-type validation

# Test with real PetroTrade example
python manage.py demo_centralized_generation --demo-type real-example
```

### Frontend Integration

```javascript
// ✅ CORRECT: Use API endpoint
const generateBooks = async (boxId, firstSerial, lastSerial) => {
  const response = await fetch(`/api/boxes/${boxId}/generate_books/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      first_serial: firstSerial,
      last_serial: lastSerial,
      books_per_box: 10,
      coupons_per_book: 100,
      force: false
    })
  });
  
  const result = await response.json();
  return result;
};

// ❌ WRONG: Never generate locally
// const generateBooksLocally = () => {
//   // This creates mismatches with physical coupons!
//   // NEVER DO THIS!
// };
```

## 🛡️ Safety Features

### 1. Validation
- Serial format validation using regex patterns
- Range continuity checks
- Overlap detection with existing coupons
- Business rule validation

### 2. Atomic Transactions
- All generation happens in database transactions
- Rollback on any error
- Consistent state guaranteed

### 3. Conflict Prevention
- Check for existing books before generation
- Serial number uniqueness enforcement
- Force flag required for overwrites

### 4. Audit Trail
- All generation logged with user and timestamp
- Book and coupon metadata tracking
- Generation source identification

## 📊 Database Schema Updates

### New Fields Added

**Box Model:**
- `first_coupon_serial` - First coupon in the box
- `last_coupon_serial` - Last coupon in the box  
- `total_books` - Number of books generated
- `coupons_per_book` - Coupons per book setting

**Book Model:**
- `first_coupon_serial` - First coupon in this book
- `last_coupon_serial` - Last coupon in this book
- `total_coupons` - Count of coupons in this book
- `is_generated` - Whether generated via service

**Coupon Model:**
- `coupon_serial` - PetroTrade serial number
- `page_number` - Page within book (1-based)
- `fuel_type` - Fuel type (PETROL/DIESEL)
- `coupon_value` - Denomination in litres

## 🧪 Testing

### Automated Tests

```bash
# Run comprehensive tests
cd backend
python test_centralized_generation.py
```

### Manual Testing

1. **Real PetroTrade Example:**
   - FROM: `PU006H1355101`
   - TO: `PU006H1355200`
   - Generates exactly 100 coupons as in physical book

2. **Full Box Example:**
   - FROM: `PU006H1355101`
   - TO: `PU006H1356100`
   - Generates 10 books with 100 coupons each

3. **Error Handling:**
   - Invalid serial formats
   - Overlapping ranges
   - Missing boxes
   - Permission denied

## 🚨 Migration Required

Apply the database migration:

```bash
python manage.py migrate fuel 0009_centralized_book_generation
```

## ✅ Verification Checklist

Before deploying to production:

- [ ] Database migration applied
- [ ] API endpoints accessible
- [ ] Permissions configured correctly
- [ ] Frontend updated to use APIs only
- [ ] Local generation code removed from frontend
- [ ] Test with real PetroTrade serial numbers
- [ ] Verify 10-book box generation
- [ ] Confirm no serial gaps or overlaps
- [ ] Audit trail working
- [ ] Error handling tested

## 🎯 Benefits

1. **Eliminates Mismatches:** Single source prevents frontend/backend conflicts
2. **Real Coupon Tracking:** Matches actual PetroTrade physical coupons
3. **Audit Compliance:** Full trail of who generated what when
4. **Data Integrity:** Atomic transactions ensure consistency
5. **Scalability:** Centralized service handles complex serial logic
6. **Maintainability:** Single codebase for all generation logic

## 🔗 Related Files

- `fuel/utils/petrotrade_serials.py` - Serial number utilities
- `fuel/services/book_generation.py` - Generation service
- `fuel/views_main.py` - API endpoints
- `fuel/models.py` - Updated data models
- `fuel/management/commands/generate_box_books.py` - CLI tool
- `fuel/management/commands/demo_centralized_generation.py` - Demo tool
- `fuel/migrations/0009_centralized_book_generation.py` - Database migration

---

**⚠️ REMEMBER: This is the SINGLE SOURCE OF TRUTH. Frontend must never generate books locally!**
