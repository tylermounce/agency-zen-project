-- Function to add admin to all existing workspaces
CREATE OR REPLACE FUNCTION public.add_admin_to_all_workspaces()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add all admins to new workspaces
CREATE OR REPLACE FUNCTION public.add_all_admins_to_workspace()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to add admin to all workspaces when they get admin role
CREATE TRIGGER trigger_add_admin_to_workspaces
  AFTER INSERT ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.add_admin_to_all_workspaces();

-- Trigger to add all admins to new workspaces
CREATE TRIGGER trigger_add_admins_to_new_workspace
  AFTER INSERT ON public.workspaces
  FOR EACH ROW
  EXECUTE FUNCTION public.add_all_admins_to_workspace();

-- Add existing admins to existing workspaces (one-time sync)
INSERT INTO public.workspace_members (workspace_id, user_id, role)
SELECT w.id, ur.user_id, 'admin'
FROM public.workspaces w
CROSS JOIN public.user_roles ur
WHERE ur.role = 'admin'
AND NOT EXISTS (
  SELECT 1 FROM public.workspace_members wm 
  WHERE wm.workspace_id = w.id AND wm.user_id = ur.user_id
);