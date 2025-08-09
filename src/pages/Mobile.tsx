import React, { useState } from 'react';
import { CheckSquare, Inbox } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { MyTasks } from '@/components/MyTasks';
import { MasterInbox } from '@/components/MasterInbox';

// Simple mobile shell with bottom tabs for Tasks and Inbox
const Mobile: React.FC = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<'tasks' | 'inbox'>('tasks');

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="px-4 pt-4 pb-2">
        <h1 className="text-xl font-semibold">
          {tab === 'tasks' ? 'My Tasks' : 'Master Inbox'}
        </h1>
      </header>

      <main className="flex-1 overflow-y-auto pb-24">
        {tab === 'tasks' && (
          <section aria-label="My Tasks">
            <MyTasks />
          </section>
        )}
        {tab === 'inbox' && (
          <section aria-label="Master Inbox">
            {user && (
              <MasterInbox userId={user.id} onBack={() => {}} />
            )}
          </section>
        )}
      </main>

      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <ul className="grid grid-cols-2">
          <li>
            <button
              className={`w-full flex flex-col items-center justify-center gap-1 py-3 ${
                tab === 'tasks' ? 'text-primary' : 'text-muted-foreground'
              }`}
              onClick={() => setTab('tasks')}
              aria-current={tab === 'tasks' ? 'page' : undefined}
            >
              <CheckSquare className="h-5 w-5" aria-hidden="true" />
              <span className="text-xs">My Tasks</span>
            </button>
          </li>
          <li>
            <button
              className={`w-full flex flex-col items-center justify-center gap-1 py-3 ${
                tab === 'inbox' ? 'text-primary' : 'text-muted-foreground'
              }`}
              onClick={() => setTab('inbox')}
              aria-current={tab === 'inbox' ? 'page' : undefined}
            >
              <Inbox className="h-5 w-5" aria-hidden="true" />
              <span className="text-xs">Master Inbox</span>
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Mobile;
