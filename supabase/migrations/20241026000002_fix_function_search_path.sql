-- Fix mutable search_path for update_updated_at_column function
-- This addresses the security issue where the function could access unintended schemas

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;
