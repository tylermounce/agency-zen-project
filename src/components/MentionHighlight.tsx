import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MentionHighlightProps {
  content: string;
  className?: string;
}

export const MentionHighlight: React.FC<MentionHighlightProps> = ({ content, className = '' }) => {
  const [parts, setParts] = useState<React.ReactNode[]>([content]);

  useEffect(() => {
    const processMentions = async () => {
      console.log('🎨 MentionHighlight processing content:', content);
      
      // Extract user IDs from @{userId:actual-uuid} format and replace with display names
      const mentionPattern = /@\{userId:([^}]+)\}/g;
      const mentions = [...content.matchAll(mentionPattern)];
      
      console.log('🎨 Found mentions to highlight:', mentions);
      
      if (mentions.length === 0) {
        console.log('🎨 No mentions to process, using original content');
        setParts([content]);
        return;
      }

      try {
        const userIds = mentions.map(match => match[1]);
        
        console.log('🎨 Looking up profiles for user IDs:', userIds);
        
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds);

        console.log('🎨 Profile lookup result:', profiles);

        // Build parts array interleaving plain text and mention chips using original indices
        let lastIndex = 0;
        const newParts: React.ReactNode[] = [];
        
        mentions.forEach(match => {
          const matchIndex = match.index ?? 0;
          if (matchIndex > lastIndex) {
            newParts.push(content.slice(lastIndex, matchIndex));
          }
          const userId = match[1];
          const profile = profiles?.find(p => p.id === userId);
          const displayName = profile?.full_name || 'Unknown User';
          
          console.log(`🎨 Rendering mention chip for ${match[0]} as @${displayName}`);
          
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
        
        console.log('🎨 Final processed parts:', newParts);
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