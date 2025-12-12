-- Add admin role to Official Account (rynshihfun@gmail.com)
-- This will give unlimited tryons

-- First, find the user_id for rynshihfun@gmail.com from auth.users
-- Then insert into user_roles table

INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'rynshihfun@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;
