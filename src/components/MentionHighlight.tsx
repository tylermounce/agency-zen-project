import React from 'react';

interface MentionHighlightProps {
  content: string;
  className?: string;
}

export const MentionHighlight: React.FC<MentionHighlightProps> = ({ content, className = '' }) => {
  // Split the content by mentions - match @username (including spaces and special chars until word boundary)
  const parts = content.split(/(@\S+(?:\s+\S+)*?)(?=\s|$|@)/g);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        // Check if this part is a mention
        if (part.startsWith('@') && part.length > 1) {
          return (
            <span
              key={index}
              className="bg-muted text-foreground px-1 py-0.5 rounded font-medium"
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