# Agency Zen: Multi-Tenant SaaS Roadmap

This document outlines the plan for converting Agency Zen from a single-company app to a multi-tenant SaaS platform where multiple companies can use the same application instance (e.g., app.agencyzen.com).

## Current Architecture (Single-Tenant)

```
┌─────────────────────────────────────────┐
│           Agency Zen App                │
│         (app.amplis.co)                 │
├─────────────────────────────────────────┤
│  Users ──► Workspaces ──► Projects      │
│                │                        │
│                ▼                        │
│             Tasks                       │
├─────────────────────────────────────────┤
│  Single Google Drive Connection         │
│  (one "Agency Zen" folder)              │
└─────────────────────────────────────────┘
```

- All users belong to the same implicit "organization"
- One set of workspaces shared by all users
- Single Google Drive connection for the entire app
- Admin/Manager/Member roles are global

---

## Target Architecture (Multi-Tenant)

```
┌──────────────────────────────────────────────────────────────┐
│                    Agency Zen Platform                        │
│                   (app.agencyzen.com)                         │
├──────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌───────────────┐ │
│  │   Company A     │  │   Company B     │  │   Company C   │ │
│  │  (Org Tenant)   │  │  (Org Tenant)   │  │  (Org Tenant) │ │
│  ├─────────────────┤  ├─────────────────┤  ├───────────────┤ │
│  │ Users           │  │ Users           │  │ Users         │ │
│  │ Workspaces      │  │ Workspaces      │  │ Workspaces    │ │
│  │ Projects/Tasks  │  │ Projects/Tasks  │  │ Projects/Tasks│ │
│  │ Google Drive    │  │ Google Drive    │  │ Google Drive  │ │
│  │ (their folder)  │  │ (their folder)  │  │ (their folder)│ │
│  └─────────────────┘  └─────────────────┘  └───────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

- Each company is an isolated "organization" (tenant)
- Users belong to one organization
- Workspaces are scoped to organizations
- Each organization connects their own Google Drive
- Roles are scoped per-organization

---

## Implementation Phases

### Phase 1: Database Schema Changes

#### 1.1 Create Organizations Table

```sql
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,  -- e.g., "acme-corp" for subdomain or URL routing
  logo_url TEXT,
  settings JSONB DEFAULT '{}',

  -- Billing/subscription info
  plan TEXT NOT NULL DEFAULT 'free',  -- 'free', 'starter', 'pro', 'enterprise'
  trial_ends_at TIMESTAMPTZ,
  subscription_id TEXT,  -- Stripe subscription ID

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id)
);

CREATE INDEX idx_organizations_slug ON public.organizations(slug);
```

#### 1.2 Add Organization Reference to Existing Tables

```sql
-- Add org_id to profiles (users belong to an organization)
ALTER TABLE public.profiles
ADD COLUMN org_id UUID REFERENCES public.organizations(id);

-- Add org_id to workspaces
ALTER TABLE public.workspaces
ADD COLUMN org_id UUID REFERENCES public.organizations(id);

-- Add org_id to user_roles (roles are per-org)
ALTER TABLE public.user_roles
ADD COLUMN org_id UUID REFERENCES public.organizations(id);

-- Add org_id to project_templates
ALTER TABLE public.project_templates
ADD COLUMN org_id UUID REFERENCES public.organizations(id);

-- Scope Google Drive settings per organization
ALTER TABLE public.google_drive_settings
ADD COLUMN org_id UUID REFERENCES public.organizations(id);

-- Add indexes
CREATE INDEX idx_profiles_org ON public.profiles(org_id);
CREATE INDEX idx_workspaces_org ON public.workspaces(org_id);
CREATE INDEX idx_user_roles_org ON public.user_roles(org_id);
CREATE INDEX idx_google_drive_settings_org ON public.google_drive_settings(org_id);
```

#### 1.3 Update RLS Policies

All RLS policies need to be updated to include organization scoping:

```sql
-- Example: Updated workspace policy
CREATE POLICY "Users can view workspaces in their organization"
ON public.workspaces FOR SELECT USING (
  org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid())
);

-- Example: Updated user_roles policy
CREATE POLICY "Users can view roles in their organization"
ON public.user_roles FOR SELECT USING (
  org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid())
);
```

---

### Phase 2: Authentication & Onboarding Flow

#### 2.1 Organization Creation Flow

New signup flow:
1. User signs up with email
2. User either:
   - Creates a new organization (becomes org admin)
   - Joins existing organization via invite link
3. Profile is linked to the organization

#### 2.2 Invitation System

```sql
CREATE TABLE public.organization_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  invited_by UUID NOT NULL REFERENCES public.profiles(id),
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### 2.3 Login Flow Options

**Option A: Single Login Page**
- User logs in at app.agencyzen.com
- System looks up their organization from profile
- Redirects to their org context

**Option B: Subdomain per Organization**
- Each org gets subdomain: acme.agencyzen.com
- Login is org-specific
- More complex DNS/routing setup

**Recommendation:** Start with Option A (simpler), migrate to B later if needed.

---

### Phase 3: Frontend Changes

#### 3.1 Organization Context Provider

```typescript
// src/contexts/OrganizationContext.tsx
interface OrganizationContextType {
  organization: Organization | null;
  isLoading: boolean;
  switchOrganization: (orgId: string) => void; // For users in multiple orgs
}

const OrganizationContext = createContext<OrganizationContextType>(null);

export function OrganizationProvider({ children }) {
  // Fetch user's organization on mount
  // Provide org context to entire app
}
```

#### 3.2 Update All Data Hooks

All data fetching hooks need to filter by organization:

```typescript
// Example: useSupabaseData changes
const fetchWorkspaces = async () => {
  const { data } = await supabase
    .from('workspaces')
    .select('*')
    .eq('org_id', currentOrg.id)  // Add org filter
    .order('name');
};
```

#### 3.3 Organization Settings Page

New settings section for org admins:
- Organization name/logo
- Billing & subscription
- Team management (invite users)
- Google Drive connection (per-org)

---

### Phase 4: Google Drive Integration (Per-Org)

#### 4.1 OAuth Flow Changes

The current OAuth flow stays mostly the same, but:
- Tokens are stored with `org_id` reference
- Each org connects their own Google account
- "Agency Zen" folder is created in their Drive

#### 4.2 Shared OAuth Client

You (the platform owner) maintain ONE Google OAuth client:
- Client ID/Secret are your platform credentials
- Each org admin authenticates their Google account
- Their tokens are stored scoped to their org

This is the standard pattern for SaaS apps (like Zapier, Slack, etc.).

---

### Phase 5: Billing Integration

#### 5.1 Stripe Integration

```typescript
// Pricing tiers example
const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    limits: {
      users: 3,
      workspaces: 2,
      storage: '1GB'
    }
  },
  starter: {
    name: 'Starter',
    price: 29,
    limits: {
      users: 10,
      workspaces: 10,
      storage: '10GB'
    }
  },
  pro: {
    name: 'Pro',
    price: 79,
    limits: {
      users: 'unlimited',
      workspaces: 'unlimited',
      storage: '100GB'
    }
  }
};
```

#### 5.2 Billing Tables

```sql
CREATE TABLE public.billing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id),
  stripe_event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

### Phase 6: Migration Strategy

#### 6.1 Migrating Existing Data

For your current single-tenant setup:

```sql
-- 1. Create your organization
INSERT INTO organizations (id, name, slug)
VALUES ('your-org-uuid', 'Your Company', 'your-company');

-- 2. Assign all existing users to this org
UPDATE profiles SET org_id = 'your-org-uuid';

-- 3. Assign all workspaces to this org
UPDATE workspaces SET org_id = 'your-org-uuid';

-- 4. Update other tables similarly
UPDATE user_roles SET org_id = 'your-org-uuid';
UPDATE project_templates SET org_id = 'your-org-uuid';
UPDATE google_drive_settings SET org_id = 'your-org-uuid';
```

#### 6.2 Deployment Steps

1. Deploy database migrations (add org_id columns, nullable initially)
2. Run data migration to assign existing data to your org
3. Make org_id columns NOT NULL
4. Deploy updated RLS policies
5. Deploy frontend changes
6. Test thoroughly with your org
7. Open registration for new organizations

---

## Security Considerations

### Data Isolation
- RLS policies MUST enforce org isolation
- Never trust client-side org_id - always derive from auth.uid()
- Audit logging for cross-org access attempts

### Admin Access
- Platform super-admin vs org admin distinction
- Platform admin can impersonate orgs for support (with audit trail)

### API Security
- Rate limiting per organization
- API keys scoped to organization

---

## File Structure Changes

```
src/
├── contexts/
│   └── OrganizationContext.tsx    # NEW
├── components/
│   ├── auth/
│   │   ├── CreateOrganization.tsx # NEW
│   │   └── JoinOrganization.tsx   # NEW
│   └── settings/
│       ├── OrganizationSettings.tsx # NEW
│       └── BillingSettings.tsx      # NEW
├── hooks/
│   ├── useOrganization.tsx        # NEW
│   └── useSupabaseData.tsx        # UPDATE (add org filtering)
└── pages/
    ├── Onboarding.tsx             # NEW
    └── Settings.tsx               # UPDATE (add org settings)
```

---

## Timeline Estimate

| Phase | Complexity | Dependencies |
|-------|------------|--------------|
| Phase 1: Database | Medium | None |
| Phase 2: Auth/Onboarding | High | Phase 1 |
| Phase 3: Frontend | Medium | Phases 1-2 |
| Phase 4: Google Drive | Low | Phase 1 |
| Phase 5: Billing | High | Phases 1-3 |
| Phase 6: Migration | Low | All phases |

---

## Questions to Decide Later

1. **Subdomain routing?** - Do orgs get their own subdomain?
2. **Multiple org membership?** - Can a user belong to multiple orgs?
3. **White-labeling?** - Custom branding per org?
4. **Data export?** - Can orgs export all their data?
5. **SSO/SAML?** - Enterprise single sign-on?

---

## Summary

Converting to multi-tenant requires:
1. Adding `organizations` table as the top-level tenant
2. Adding `org_id` to all relevant tables
3. Updating RLS policies for org isolation
4. Building org creation/invitation flows
5. Scoping all data queries to current org
6. Per-org Google Drive connections (already designed for this)
7. Billing integration (Stripe recommended)

The current codebase is well-structured for this migration. The main work is database schema changes and updating data hooks to be org-aware.
