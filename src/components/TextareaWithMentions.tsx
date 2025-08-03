import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { UserMentionDropdown } from '@/components/UserMentionDropdown';
import { useUserMentions } from '@/hooks/useUserMentions';

interface TextareaWithMentionsProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  workspaceId?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  disabled?: boolean;
}

export const TextareaWithMentions: React.FC<TextareaWithMentionsProps> = ({
  value,
  onChange,
  placeholder,
  className,
  workspaceId,
  onKeyDown,
  disabled
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const { mentionState, handleTextChange, handleUserSelect, closeMentions } = useUserMentions(workspaceId);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPosition = e.target.selectionStart;
    console.log('TextareaWithMentions: Input changed', { newValue, cursorPosition, workspaceId });
    
    onChange(newValue);
    handleTextChange(newValue, cursorPosition);
  }, [onChange, handleTextChange, workspaceId]);

  const handleKeyDownInternal = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionState.isActive) {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeMentions();
        return;
      }
      
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        // Handle arrow navigation in dropdown if needed
        return;
      }
      
      if (e.key === 'Enter' && mentionState.suggestions.length > 0) {
        e.preventDefault();
        const firstSuggestion = mentionState.suggestions[0];
        const result = handleUserSelect(firstSuggestion, value, textareaRef.current?.selectionStart || 0);
        onChange(result.text);
        
        // Set cursor position after state update
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.setSelectionRange(result.cursorPosition, result.cursorPosition);
            textareaRef.current.focus();
          }
        }, 0);
        return;
      }
    }
    
    // Call parent onKeyDown if provided
    onKeyDown?.(e);
  }, [mentionState, closeMentions, handleUserSelect, value, onChange, onKeyDown]);

  const handleUserSelectFromDropdown = useCallback((user: any) => {
    const result = handleUserSelect(user, value, textareaRef.current?.selectionStart || 0);
    onChange(result.text);
    
    // Set cursor position and focus after state update
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.setSelectionRange(result.cursorPosition, result.cursorPosition);
        textareaRef.current.focus();
      }
    }, 0);
  }, [handleUserSelect, value, onChange]);

  // Update dropdown position when mention state changes
  useEffect(() => {
    if (mentionState.isActive && textareaRef.current) {
      const textarea = textareaRef.current;
      const rect = textarea.getBoundingClientRect();
      
      // Calculate approximate cursor position (this is a simplified calculation)
      const lineHeight = parseInt(getComputedStyle(textarea).lineHeight) || 20;
      const charWidth = 8; // Approximate character width
      
      // Get text before cursor to calculate position
      const textBeforeCursor = value.substring(0, textarea.selectionStart);
      const lines = textBeforeCursor.split('\n');
      const currentLine = lines.length - 1;
      const currentLineLength = lines[currentLine]?.length || 0;
      
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX + Math.min(currentLineLength * charWidth, rect.width - 200)
      });
    }
  }, [mentionState.isActive, value]);

  // Close mentions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (mentionState.isActive && textareaRef.current && !textareaRef.current.contains(e.target as Node)) {
        closeMentions();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mentionState.isActive, closeMentions]);

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDownInternal}
        placeholder={placeholder}
        className={className}
        disabled={disabled}
      />
      
      <UserMentionDropdown
        users={mentionState.suggestions}
        isVisible={mentionState.isActive}
        onUserSelect={handleUserSelectFromDropdown}
        position={dropdownPosition}
      />
    </div>
  );
};