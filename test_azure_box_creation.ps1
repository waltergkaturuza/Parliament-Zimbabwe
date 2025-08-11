# Azure CLI Test Script for Box Creation
# Test the exact Azure production endpoint with different field name scenarios

# Your Azure App Service URL
$AZURE_URL = "https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net"

Write-Host "=== AZURE PRODUCTION BOX CREATION TESTS ===" -ForegroundColor Green
Write-Host ""

# First, you need to get an authentication token
Write-Host "1. Get Authentication Token:" -ForegroundColor Yellow
Write-Host "   Use this command to login and get a token:" -ForegroundColor White
Write-Host "   curl -X POST `"$AZURE_URL/api/v1/auth/login/`" \\" -ForegroundColor Cyan
Write-Host "        -H `"Content-Type: application/json`" \\" -ForegroundColor Cyan
Write-Host "        -d `"{`\`"username`\`": `\`"your_username`\`", `\`"password`\`": `\`"your_password`\`"}`"" -ForegroundColor Cyan
Write-Host ""

# Test 1: Original data structure that failed (missing box_code)
Write-Host "2. Test Original Failing Data (should fail with box_code required):" -ForegroundColor Yellow
$test1_data = @'
{
  "barcode": "",
  "book_details": [
    {
      "book_id": "Book 1",
      "book_number": 1,
      "first_coupon_id": "PU008GH123200",
      "last_coupon_id": "PU008GH123299",
      "number_of_coupons": 100
    }
  ],
  "calculation_mode": "first-and-count",
  "coupons_per_book": 100,
  "first_coupon_id": "PU008GH123200",
  "last_coupon_id": "PU008GH124199",
  "notes": "TEST - MISSING BOX_CODE",
  "number_of_books": 10,
  "received_at": "2025-08-11T08:10:00Z",
  "status": "RECEIVED",
  "total_coupons": 1000
}
'@

Write-Host "   curl -X POST `"$AZURE_URL/api/v1/boxes/`" \\" -ForegroundColor Cyan
Write-Host "        -H `"Content-Type: application/json`" \\" -ForegroundColor Cyan
Write-Host "        -H `"Authorization: Bearer YOUR_TOKEN_HERE`" \\" -ForegroundColor Cyan
Write-Host "        -d '$test1_data'" -ForegroundColor Cyan
Write-Host ""

# Test 2: With box_code field
Write-Host "3. Test With box_code Field (should work):" -ForegroundColor Yellow
$test2_data = @'
{
  "box_code": "FCB-2025-TEST001",
  "barcode": "",
  "book_details": [
    {
      "book_id": "Book 1",
      "book_number": 1,
      "first_coupon_id": "PU008GH123200",
      "last_coupon_id": "PU008GH123299",
      "number_of_coupons": 100
    }
  ],
  "calculation_mode": "first-and-count",
  "coupons_per_book": 100,
  "first_coupon_id": "PU008GH123200",
  "last_coupon_id": "PU008GH124199",
  "notes": "TEST - WITH BOX_CODE",
  "number_of_books": 10,
  "received_at": "2025-08-11T08:10:00Z",
  "status": "RECEIVED",
  "total_coupons": 1000
}
'@

Write-Host "   curl -X POST `"$AZURE_URL/api/v1/boxes/`" \\" -ForegroundColor Cyan
Write-Host "        -H `"Content-Type: application/json`" \\" -ForegroundColor Cyan
Write-Host "        -H `"Authorization: Bearer YOUR_TOKEN_HERE`" \\" -ForegroundColor Cyan
Write-Host "        -d '$test2_data'" -ForegroundColor Cyan
Write-Host ""

# Test 3: With box_id field (alternative naming)
Write-Host "4. Test With box_id Field (alternative naming):" -ForegroundColor Yellow
$test3_data = @'
{
  "box_id": "FCB-2025-TEST002",
  "barcode": "",
  "book_details": [
    {
      "book_id": "Book 1",
      "book_number": 1,
      "first_coupon_id": "PU008GH123200",
      "last_coupon_id": "PU008GH123299",
      "number_of_coupons": 100
    }
  ],
  "calculation_mode": "first-and-count",
  "coupons_per_book": 100,
  "first_coupon_id": "PU008GH123200",
  "last_coupon_id": "PU008GH124199",
  "notes": "TEST - WITH BOX_ID",
  "number_of_books": 10,
  "received_at": "2025-08-11T08:10:00Z",
  "status": "RECEIVED",
  "total_coupons": 1000
}
'@

Write-Host "   curl -X POST `"$AZURE_URL/api/v1/boxes/`" \\" -ForegroundColor Cyan
Write-Host "        -H `"Content-Type: application/json`" \\" -ForegroundColor Cyan
Write-Host "        -H `"Authorization: Bearer YOUR_TOKEN_HERE`" \\" -ForegroundColor Cyan
Write-Host "        -d '$test3_data'" -ForegroundColor Cyan
Write-Host ""

# Test 4: With boxId field (camelCase)
Write-Host "5. Test With boxId Field (camelCase):" -ForegroundColor Yellow
$test4_data = @'
{
  "boxId": "FCB-2025-TEST003",
  "barcode": "",
  "book_details": [
    {
      "book_id": "Book 1",
      "book_number": 1,
      "first_coupon_id": "PU008GH123200",
      "last_coupon_id": "PU008GH123299",
      "number_of_coupons": 100
    }
  ],
  "calculation_mode": "first-and-count",
  "coupons_per_book": 100,
  "first_coupon_id": "PU008GH123200",
  "last_coupon_id": "PU008GH124199",
  "notes": "TEST - WITH BOXID",
  "number_of_books": 10,
  "received_at": "2025-08-11T08:10:00Z",
  "status": "RECEIVED",
  "total_coupons": 1000
}
'@

Write-Host "   curl -X POST `"$AZURE_URL/api/v1/boxes/`" \\" -ForegroundColor Cyan
Write-Host "        -H `"Content-Type: application/json`" \\" -ForegroundColor Cyan
Write-Host "        -H `"Authorization: Bearer YOUR_TOKEN_HERE`" \\" -ForegroundColor Cyan
Write-Host "        -d '$test4_data'" -ForegroundColor Cyan
Write-Host ""

Write-Host "=== EXPECTED RESULTS ===" -ForegroundColor Green
Write-Host "Test 1 (no box identifier): Should return 400 Bad Request with 'box_code required'" -ForegroundColor Red
Write-Host "Test 2 (box_code): Should return 201 Created (after our fix is deployed)" -ForegroundColor Green
Write-Host "Test 3 (box_id): Should return 201 Created (after our fix is deployed)" -ForegroundColor Green
Write-Host "Test 4 (boxId): Should return 201 Created (after our fix is deployed)" -ForegroundColor Green
Write-Host ""

Write-Host "=== HOW TO GET YOUR AUTH TOKEN ===" -ForegroundColor Yellow
Write-Host "1. Login to your Azure app in browser: $AZURE_URL/admin/" -ForegroundColor White
Write-Host "2. Open browser developer tools (F12)" -ForegroundColor White
Write-Host "3. Go to Network tab and make a request" -ForegroundColor White
Write-Host "4. Look for Authorization header with 'Bearer' token" -ForegroundColor White
Write-Host "5. Copy that token and replace YOUR_TOKEN_HERE in the commands above" -ForegroundColor White
Write-Host ""

Write-Host "=== QUICK TEST COMMANDS ===" -ForegroundColor Yellow
Write-Host "Save one of the JSON objects above to a file (e.g., test_box.json) and run:" -ForegroundColor White
Write-Host "curl -X POST `"$AZURE_URL/api/v1/boxes/`" -H `"Content-Type: application/json`" -H `"Authorization: Bearer YOUR_TOKEN`" -d @test_box.json" -ForegroundColor Cyan
