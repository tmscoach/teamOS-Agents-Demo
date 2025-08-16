-- Update the admin user to have correct role and journey status
UPDATE "User" 
SET 
  role = 'ADMIN',
  "journeyStatus" = 'ACTIVE'
WHERE email = 'rowan@teammanagementsystems.com';