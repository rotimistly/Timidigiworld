-- Fix RLS policies for profiles table to allow proper profile updates
-- Drop the problematic UPDATE policies
DROP POLICY IF EXISTS "Users can update their own profile (no role changes)" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile secure" ON public.profiles;

-- Create a new, simpler UPDATE policy that allows users to update their own profiles
-- but prevents unauthorized role changes
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id AND
  -- Allow admin users to change any role
  (get_user_role(auth.uid()) = 'admin' OR 
   -- Non-admin users can only keep their current role or change to 'seller' or 'user'
   (user_role IN ('user', 'seller') AND 
    -- Prevent users from elevating themselves to admin
    user_role != 'admin'))
);