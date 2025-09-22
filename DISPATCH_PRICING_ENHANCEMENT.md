# Dispatch Pricing Enhancement Summary

## Overview
Enhanced the BookDispatch model and frontend to display accurate liters and values (USD and ZWG) based on per-box pricing captured during batch reception, including exchange rates.

## Backend Changes

### 1. BookDispatch Model Properties (models.py)
- **total_value**: Now computes using per-box `fuel_price_per_litre_usd` from Box model, falls back to FuelPrice.get_current_price() or default 1.45 USD/L
- **total_litres**: Accurately sums litres from all books (coupon_count * denomination)
- **total_value_usd**: Returns the computed total_value as Decimal for precision
- **total_value_zwg**: New property computing ZWG value using per-box `exchange_rate_zwg_usd`
- **average_price_per_litre_usd**: Weighted average USD price across all books in dispatch
- **average_exchange_rate_usd_zwg**: Weighted average exchange rate where available

### 2. BookDispatchSerializer (serializers.py)
- Added read-only fields: `total_value_zwg`, `average_price_per_litre_usd`, `average_exchange_rate_usd_zwg`
- Added `price_breakdown` computed field showing per-book pricing details including:
  - Book and box IDs/codes
  - Litres per book
  - USD price per litre
  - USD value
  - Exchange rate and ZWG value (where available)

## Frontend Changes

### BookDispatchManagement.tsx
- **Interface Enhancement**: Added new fields to BookDispatch interface
- **Data Mapping**: Maps backend pricing fields from API response
- **Table Columns**: 
  - Corrected ZWG Value column to use `totalValueZwg` instead of legacy `totalValue`
  - Enhanced USD Value column formatting
- **View Modal**: Added row showing ZWG value, average price/L, and average exchange rate

## Pricing Logic Flow
1. **Per Box**: Each Box stores `fuel_price_per_litre_usd` and `exchange_rate_zwg_usd` captured during batch reception
2. **Dispatch Calculation**: BookDispatch properties iterate through all books, using per-box pricing when available
3. **Fallback Strategy**: If box lacks pricing, falls back to current FuelPrice model or default 1.45 USD/L
4. **Frontend Display**: Shows computed totals, averages, and detailed breakdown for transparency

## Benefits
- **Accuracy**: Reflects actual captured batch prices rather than hard-coded values
- **Transparency**: Price breakdown shows per-book pricing for audit trails
- **Flexibility**: Supports mixed dispatches with different box prices/exchange rates
- **Backward Compatibility**: Maintains existing field names while improving calculations

## Files Modified
- `backend/fuel/models.py` - BookDispatch pricing properties
- `backend/fuel/serializers.py` - BookDispatchSerializer enhancement
- `fuel-coupon-frontend/src/pages/main-center/components/BookDispatchManagement.tsx` - Interface and display updates