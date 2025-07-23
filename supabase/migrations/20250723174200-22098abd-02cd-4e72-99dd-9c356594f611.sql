-- Fix search path for existing functions
CREATE OR REPLACE FUNCTION public.add_admin_to_all_workspaces()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path TO ''
AS $$
BEGIN
  -- Only proceed if the new role is admin
  IF NEW.role = 'admin' THEN
    -- Add this admin to all existing workspaces
    INSERT INTO public.workspace_members (workspace_id, user_id, role)
    SELECT w.id, NEW.user_id, 'admin'
    FROM public.workspaces w
    WHERE NOT EXISTS (
      SELECT 1 FROM public.workspace_members wm 
      WHERE wm.workspace_id = w.id AND wm.user_id = NEW.user_id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.add_all_admins_to_workspace()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path TO ''
AS $$
BEGIN
  -- Add all existing admins to this new workspace
  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  SELECT NEW.id, ur.user_id, 'admin'
  FROM public.user_roles ur
  WHERE ur.role = 'admin'
  AND NOT EXISTS (
    SELECT 1 FROM public.workspace_members wm 
    WHERE wm.workspace_id = NEW.id AND wm.user_id = ur.user_id
  );
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS public.app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = auth.uid()
  ORDER BY 
    CASE 
      WHEN role = 'admin' THEN 1
      WHEN role = 'user' THEN 2
    END
  LIMIT 1
$$;