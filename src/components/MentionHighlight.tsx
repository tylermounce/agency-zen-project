import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MentionHighlightProps {
  content: string;
  className?: string;
}

export const MentionHighlight: React.FC<MentionHighlightProps> = ({ content, className = '' }) => {
  const [processedContent, setProcessedContent] = useState(content);

  useEffect(() => {
    const processMentions = async () => {
      // Extract user IDs from @{userId:actual-uuid} format and replace with display names
      const mentionPattern = /@\{userId:([^}]+)\}/g;
      const mentions = [...content.matchAll(mentionPattern)];
      
      if (mentions.length === 0) {
        setProcessedContent(content);
        return;
      }

      try {
        const userIds = mentions.map(match => match[1]);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds);

        let result = content;
        
        // Replace each mention with the actual display name
        mentions.forEach(match => {
          const userId = match[1];
          const profile = profiles?.find(p => p.id === userId);
          const displayName = profile?.full_name || 'Unknown User';
          result = result.replace(match[0], `@${displayName}`);
        });

        setProcessedContent(result);
      } catch (error) {
        console.error('Error processing mentions:', error);
        setProcessedContent(content);
      }
    };

    processMentions();
  }, [content]);

  // Split the processed content by mentions to highlight them
  const parts = processedContent.split(/(@[^@\s]+(?:\s+[^@\s]+)*)/g);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        // Check if this part is a mention
        if (part.startsWith('@') && part.length > 1 && !part.includes('{')) {
          return (
            <span
              key={index}
              className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-1 py-0.5 rounded font-medium"
            >
              {part}
            </span>
          );
        }
        return part;
      })}
    </span>
  );
};