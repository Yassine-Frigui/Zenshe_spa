-- Step 4: Update healing add-on service
UPDATE services 
SET service_type = 'addon', 
    description = 'Enhancement add-on for V-Steam services - provides additional healing benefits'
WHERE id = 7;