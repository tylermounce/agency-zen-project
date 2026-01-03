import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Users, Building, Shield, Bell, Palette, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { ProfileSettings } from '@/components/settings/ProfileSettings';
import { UserManagement } from '@/components/settings/UserManagement';
import { WorkspaceSettings } from '@/components/settings/WorkspaceSettings';
import { SecuritySettings } from '@/components/settings/SecuritySettings';
import { TemplateManagement } from '@/components/settings/TemplateManagement';

type SettingsSection = 'profile' | 'security' | 'users' | 'workspaces' | 'templates' | 'notifications' | 'appearance';

export default function Settings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, loading } = useUserRole();
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const userSections = [
    { id: 'profile' as const, label: 'Profile', icon: User, description: 'Manage your personal information' },
    { id: 'security' as const, label: 'Security', icon: Shield, description: 'Password and authentication settings' },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell, description: 'Email and push notification preferences' },
    { id: 'appearance' as const, label: 'Appearance', icon: Palette, description: 'Theme and display preferences' },
  ];

  const adminSections = [
    { id: 'users' as const, label: 'User Management', icon: Users, description: 'Manage users and roles' },
    { id: 'workspaces' as const, label: 'Workspace Settings', icon: Building, description: 'Configure workspaces and permissions' },
    { id: 'templates' as const, label: 'Project Templates', icon: FileText, description: 'Create and manage project templates' },
  ];

  const allSections = isAdmin ? [...userSections, ...adminSections] : userSections;

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return <ProfileSettings />;
      case 'security':
        return <SecuritySettings />;
      case 'users':
        return isAdmin ? <UserManagement /> : null;
      case 'workspaces':
        return isAdmin ? <WorkspaceSettings /> : null;
      case 'templates':
        return isAdmin ? <TemplateManagement /> : null;
      case 'notifications':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Notification settings coming soon...</p>
            </CardContent>
          </Card>
        );
      case 'appearance':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Theme and appearance settings coming soon...</p>
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to App
          </Button>
          <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        </div>
      </div>

      <div className="flex min-h-screen">
        {/* Sidebar */}
        <div className="w-72 bg-white border-r border-gray-200 p-6">
          <div className="space-y-1">
            {allSections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    activeSection === section.id
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium">{section.label}</div>
                      <div className="text-sm text-gray-500 mt-1">{section.description}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {isAdmin && (
            <>
              <Separator className="my-6" />
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                Administrator
              </div>
              <div className="text-sm text-gray-600">
                You have administrator privileges to manage users and workspaces.
              </div>
            </>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          <div className="max-w-4xl">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}