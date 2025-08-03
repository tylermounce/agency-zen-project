import React from 'react';

interface MentionHighlightProps {
  content: string;
  className?: string;
}

export const MentionHighlight: React.FC<MentionHighlightProps> = ({ content, className = '' }) => {
  // Split the content by mentions (@username patterns)
  const parts = content.split(/(@[^\s]+)/g);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        // Check if this part is a mention
        if (part.startsWith('@')) {
          return (
            <span
              key={index}
              className="bg-primary/10 text-primary px-1 py-0.5 rounded font-medium"
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