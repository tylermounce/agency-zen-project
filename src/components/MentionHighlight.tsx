import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MentionHighlightProps {
  content: string;
  className?: string;
}

// Cache for profile lookups
const profileCache = new Map<string, string>();

export const MentionHighlight: React.FC<MentionHighlightProps> = ({ content, className = '' }) => {
  const [parts, setParts] = useState<React.ReactNode[]>([content]);

  useEffect(() => {
    const processMentions = async () => {
      // Extract user IDs from @{userId:actual-uuid} format and replace with display names
      const mentionPattern = /@\{userId:([^}]+)\}/g;
      const mentions = [...content.matchAll(mentionPattern)];

      if (mentions.length === 0) {
        setParts([content]);
        return;
      }

      try {
        const userIds = mentions.map(match => match[1]);

        // Check which IDs need to be fetched
        const uncachedIds = userIds.filter(id => !profileCache.has(id));

        if (uncachedIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', uncachedIds);

          // Update cache
          (profiles || []).forEach(profile => {
            profileCache.set(profile.id, profile.full_name || 'Unknown User');
          });
        }

        // Build parts array interleaving plain text and mention chips
        let lastIndex = 0;
        const newParts: React.ReactNode[] = [];

        mentions.forEach(match => {
          const matchIndex = match.index ?? 0;
          if (matchIndex > lastIndex) {
            newParts.push(content.slice(lastIndex, matchIndex));
          }
          const userId = match[1];
          const displayName = profileCache.get(userId) || 'Unknown User';

          newParts.push(
            <span
              key={`mention-${matchIndex}-${userId}`}
              className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-1 py-0.5 rounded font-medium"
            >
              @{displayName}
            </span>
          );
          lastIndex = matchIndex + match[0].length;
        });

        if (lastIndex < content.length) {
          newParts.push(content.slice(lastIndex));
        }

        setParts(newParts);
      } catch (error) {
        console.error('Error processing mentions:', error);
        setParts([content]);
      }
    };

    processMentions();
  }, [content]);

  return (
    <span className={className}>
      {parts}
    </span>
  );
};
