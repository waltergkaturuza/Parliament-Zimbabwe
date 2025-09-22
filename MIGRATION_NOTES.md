# Migration Notes (2025-09-21)

## Duplicate fuel app directories
Two directories existed containing a `fuel` app structure:
- `fuel/` (active Django app used by INSTALLED_APPS and migration loader)
- `backend/fuel/` (legacy / staging copy not actually loaded by Django)

The migration confusion arose because earlier work added model changes only to `backend/fuel/models.py` while Django continued to use `fuel/models.py`. Consequently:
- `makemigrations` reported "No changes detected" since the active app models did not include the new field.
- Multiple orphan migration attempts (`10018_add_main_center_dispatch_number.py`, `10024_add_main_center_dispatch_number_and_metrics.py`, `10025_add_main_center_dispatch_number_rebased.py`) were created under `backend/fuel/migrations/` and ignored by Django.

## Applied Fix
1. Re-created missing placeholder file: `backend/fuel/migrations/10017_sync_missing_field.py` to mirror the already applied DB state (for repository completeness).
2. Added the actual field and supporting logic to the active model `fuel/models.py`:
   - Field: `main_center_dispatch_number`
   - Auto generation in overridden `save()` method (pattern `MCD-00001`).
   - Added helper properties: `total_litres`, `total_value_usd`.
3. Ran `makemigrations fuel` producing the canonical migration: `fuel/migrations/10018_bookdispatch_main_center_dispatch_number.py`.
4. Applied migration successfully (`fuel.10018_bookdispatch_main_center_dispatch_number`).
5. Verified schema column now present: `main_center_dispatch_number` in `fuel_bookdispatch`.

### 2025-09-22 Follow-up

- Corrected placeholder dependency in `backend/fuel/migrations/10017_sync_missing_field.py` to point to existing file `10016_remove_book_total_coupons_remove_coupon_fuel_type_and_more` (the earlier reference `10016_add_handover_fields_to_bookdispatch` does not exist in the legacy directory). This was needed so production migration graph validation would not fail when the legacy directory is still present in the repository.

- Added merge migration `backend/fuel/migrations/10026_merge_20250922_0000.py` to reconcile conflicting leaf nodes (`10023_bookdispatch_dispatch_type_bookdispatch_from_center_and_more` and `10025_add_main_center_dispatch_number_rebased`) in the legacy directory. This maintains production deployment stability until the legacy app directory is removed or fully decommissioned.

## Guidance Going Forward

- Treat `fuel/` as the single source of truth. Consider deleting or archiving `backend/fuel/` to avoid future confusion (ensure nothing still imports from it first).
- When adding fields, always modify `fuel/models.py` before generating migrations.
- Avoid manually fabricating high-numbered migration files unless necessary; let Django sequencing handle ordering.
- If a migration file is ever lost but recorded as applied in the DB, re-create a placeholder with identical name and empty operations (as done for `10017_sync_missing_field`).

## Cleanup (Optional Future Task)

- Remove obsolete orphan migration files in `backend/fuel/migrations/` that will never be applied.
- Add a CI check to fail if both `fuel/models.py` and `backend/fuel/models.py` diverge significantly.

-- End of notes.
