# Testing Guide: Rental Penalty System

## Overview
The penalty system automatically calculates and applies a ₱100 per day penalty when a rental is returned after the `rental_end_date`.

## Testing Steps

### Method 1: Quick Test (Using Database)

1. **Create a Rental Order** (if you don't have one):
   - Go to User Homepage → Rental Section
   - Select a rental item
   - Set start date to a past date (e.g., 3 days ago)
   - Set duration (e.g., 3 days)
   - Add to cart and complete checkout

2. **Manually Set Past End Date in Database** (for quick testing):
   ```sql
   -- Find your rental order item_id first
   SELECT item_id, order_id, rental_start_date, rental_end_date, final_price, approval_status
   FROM order_items 
   WHERE service_type = 'rental' 
   ORDER BY item_id DESC 
   LIMIT 5;
   
   -- Update the rental_end_date to 2 days ago (to simulate late return)
   UPDATE order_items 
   SET rental_end_date = DATE_SUB(CURDATE(), INTERVAL 2 DAY)
   WHERE item_id = YOUR_ITEM_ID;
   ```

3. **Mark Rental as Returned** (Admin Panel):
   - Go to Admin Panel → Rental Management
   - Find the rental order
   - Click "Edit" button (or use the status update arrow button)
   - Change status to "Returned"
   - Click "Save Changes" (or confirm)

4. **Check Penalty Applied**:
   - **Backend Console**: Look for logs like:
     ```
     [RENTAL PENALTY] Item X: End date: 2024-12-17, Today: 2024-12-19, Days exceeded: 2, Penalty: ₱200
     [RENTAL PENALTY] Original price: ₱500, Penalty: ₱200, New final price: ₱700
     ```
   
   - **Admin Panel - View Details**:
     - Click "View Details" on the rental
     - Check for yellow warning box showing: "⚠️ Late Return Penalty: ₱200 (2 days exceeded)"
     - Check "Total Price" - should include penalty
   
   - **Admin Panel - Payment Modal**:
     - Click "Record Payment" button
     - Check for penalty warning box
     - Verify "Total Price" includes penalty
   
   - **User Order Tracking**:
     - Go to User Profile → Order Tracking
     - Find the rental order
     - Click "View Details"
     - Check for yellow penalty warning box

5. **Verify Database**:
   ```sql
   -- Check pricing_factors for penalty data
   SELECT 
     item_id,
     final_price,
     JSON_EXTRACT(pricing_factors, '$.penalty') as penalty,
     JSON_EXTRACT(pricing_factors, '$.penaltyDays') as penalty_days,
     JSON_EXTRACT(pricing_factors, '$.penaltyAppliedDate') as penalty_date
   FROM order_items 
   WHERE item_id = YOUR_ITEM_ID;
   ```

### Method 2: Real-Time Test (Wait for Date to Pass)

1. **Create Rental Order**:
   - Set start date: Today
   - Set duration: 3 days
   - End date will be: Today + 2 days (3 days total including start)

2. **Wait for End Date to Pass**:
   - Wait until the day after the rental_end_date
   - Or manually update the date in database (see Method 1, Step 2)

3. **Mark as Returned**:
   - Follow Step 3 from Method 1

4. **Verify Penalty**:
   - Follow Step 4 from Method 1

### Method 3: Test Different Scenarios

#### Scenario A: Returned On Time (No Penalty)
- Set `rental_end_date` to today or future date
- Mark as "Returned"
- **Expected**: No penalty applied, console log: "Returned on time, no penalty applied"

#### Scenario B: 1 Day Late (₱100 Penalty)
- Set `rental_end_date` to yesterday
- Mark as "Returned"
- **Expected**: Penalty = ₱100, Days = 1

#### Scenario C: 2 Days Late (₱200 Penalty)
- Set `rental_end_date` to 2 days ago
- Mark as "Returned"
- **Expected**: Penalty = ₱200, Days = 2

#### Scenario D: 5 Days Late (₱500 Penalty)
- Set `rental_end_date` to 5 days ago
- Mark as "Returned"
- **Expected**: Penalty = ₱500, Days = 5

## What to Check

### ✅ Backend Verification:
1. **Console Logs**: Check for `[RENTAL PENALTY]` logs
2. **Database**: Verify `pricing_factors` contains penalty data
3. **Final Price**: Verify `final_price` = original_price + penalty

### ✅ Frontend Verification:
1. **Admin Detail Modal**: Yellow warning box with penalty info
2. **Admin Payment Modal**: Yellow warning box with penalty info
3. **User Order Tracking**: Yellow warning box in rental details
4. **Price Display**: Total price includes penalty

### ✅ Edge Cases:
1. **Already Returned**: If status is already "returned", penalty should not be recalculated
2. **No End Date**: If `rental_end_date` is NULL, no penalty should be applied
3. **Returned Early**: If returned before end date, no penalty should be applied

## Troubleshooting

### Penalty Not Showing:
1. Check backend console for error logs
2. Verify `rental_end_date` is set correctly in database
3. Verify status was changed to "returned" (not "completed")
4. Check `pricing_factors` JSON in database

### Penalty Calculated Incorrectly:
1. Check date calculation in console logs
2. Verify timezone settings (should use local date)
3. Check if `rental_end_date` format is correct (YYYY-MM-DD)

### Penalty Not in Final Price:
1. Check if `updateData.finalPrice` is being set correctly
2. Verify database update query executed successfully
3. Check backend logs for SQL errors

## Quick SQL Test Query

```sql
-- Test penalty calculation logic
SELECT 
  item_id,
  rental_end_date,
  CURDATE() as today,
  DATEDIFF(CURDATE(), rental_end_date) as days_exceeded,
  CASE 
    WHEN CURDATE() > rental_end_date THEN DATEDIFF(CURDATE(), rental_end_date) * 100
    ELSE 0
  END as calculated_penalty,
  final_price,
  JSON_EXTRACT(pricing_factors, '$.penalty') as stored_penalty
FROM order_items 
WHERE service_type = 'rental' 
  AND approval_status = 'returned'
ORDER BY item_id DESC
LIMIT 10;
```

