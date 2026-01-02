import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { UserMentionDropdown } from '@/components/UserMentionDropdown';
import { useUserMentions } from '@/hooks/useUserMentions';
import { supabase } from '@/integrations/supabase/client';

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
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [userDisplayNames, setUserDisplayNames] = useState<{[userId: string]: string}>({});
  const [displayValue, setDisplayValue] = useState(value);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const { mentionState, handleTextChange, handleUserSelect, closeMentions } = useUserMentions(workspaceId);

  // Reset selection when suggestions change
  useEffect(() => {
    setSelectedMentionIndex(0);
  }, [mentionState.suggestions]);

  // Convert stored format to display format for showing in textarea
  const getDisplayValue = useCallback(async (text: string) => {
    let displayText = text;
    const mentionPattern = /@\{userId:([^}]+)\}/g;
    const matches = [...text.matchAll(mentionPattern)];

    for (const match of matches) {
      const userId = match[1];
      let displayName = userDisplayNames[userId];

      if (!displayName) {
        try {
          // Fetch display name if not cached
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', userId)
            .single();

          displayName = profile?.full_name || 'Unknown User';
          setUserDisplayNames(prev => ({ ...prev, [userId]: displayName }));
        } catch (error) {
          console.error('Error fetching user display name:', error);
          displayName = 'Unknown User';
        }
      }

      displayText = displayText.replace(match[0], `@${displayName}`);
    }

    return displayText;
  }, [userDisplayNames]);

  // Convert display format back to storage format when editing existing mentions
  const convertDisplayToStorage = useCallback((text: string) => {
    let storageText = text;

    // Convert @DisplayName back to @{userId:uuid} format for any edited mentions
    Object.entries(userDisplayNames).forEach(([userId, displayName]) => {
      const displayMention = `@${displayName}`;
      const storageMention = `@{userId:${userId}}`;
      storageText = storageText.replace(new RegExp(`@${displayName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g'), storageMention);
    });

    return storageText;
  }, [userDisplayNames]);

  // Effect to update display value when the stored value changes
  useEffect(() => {
    const updateDisplayValue = async () => {
      const newDisplayValue = await getDisplayValue(value);
      setDisplayValue(newDisplayValue);
    };

    updateDisplayValue();
  }, [value, getDisplayValue]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newDisplayValue = e.target.value;
    const cursorPosition = e.target.selectionStart;

    // Update display value immediately for responsive UI
    setDisplayValue(newDisplayValue);

    // Convert display format to storage format before saving
    const storageValue = convertDisplayToStorage(newDisplayValue);
    onChange(storageValue);
    handleTextChange(newDisplayValue, cursorPosition); // Use display value for mention detection
  }, [onChange, handleTextChange, convertDisplayToStorage]);

  const handleKeyDownInternal = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionState.isActive && mentionState.suggestions.length > 0) {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeMentions();
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedMentionIndex(prev =>
          prev < mentionState.suggestions.length - 1 ? prev + 1 : 0
        );
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedMentionIndex(prev =>
          prev > 0 ? prev - 1 : mentionState.suggestions.length - 1
        );
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        const selectedUser = mentionState.suggestions[selectedMentionIndex];
        if (!selectedUser) return;

        const result = handleUserSelect(selectedUser, displayValue, textareaRef.current?.selectionStart || 0);

        // Update display names cache
        setUserDisplayNames(prev => ({ ...prev, [selectedUser.id]: selectedUser.full_name || 'Unknown User' }));

        // Update both display and storage values
        const newDisplayValue = result.text.replace(`@{userId:${selectedUser.id}}`, `@${selectedUser.full_name || 'Unknown User'}`);
        setDisplayValue(newDisplayValue);
        onChange(result.text); // Store the storage format

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
  }, [mentionState, closeMentions, handleUserSelect, displayValue, onChange, onKeyDown, selectedMentionIndex]);

  const handleUserSelectFromDropdown = useCallback((user: any) => {
    const result = handleUserSelect(user, displayValue, textareaRef.current?.selectionStart || 0);

    // Update display names cache
    setUserDisplayNames(prev => ({ ...prev, [user.id]: user.full_name || 'Unknown User' }));
    
    // Update both display and storage values
    const newDisplayValue = result.text.replace(`@{userId:${user.id}}`, `@${user.full_name || 'Unknown User'}`);
    setDisplayValue(newDisplayValue);
    onChange(result.text); // Store the storage format
    
    // Set cursor position and focus after state update
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.setSelectionRange(result.cursorPosition, result.cursorPosition);
        textareaRef.current.focus();
      }
    }, 0);
  }, [handleUserSelect, displayValue, onChange]);

  // Update dropdown position when mention state changes
  useEffect(() => {
    if (mentionState.isActive && textareaRef.current) {
      const textarea = textareaRef.current;
      const rect = textarea.getBoundingClientRect();
      
      // Calculate approximate cursor position
      const lineHeight = parseInt(getComputedStyle(textarea).lineHeight) || 20;
      const textBeforeCursor = displayValue.substring(0, textarea.selectionStart);
      const lines = textBeforeCursor.split('\n');
      const currentLine = lines.length - 1;
      
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX + 10
      });
    }
  }, [mentionState.isActive, displayValue]);

  // Close mentions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const clickedOutsideTextarea = textareaRef.current && !textareaRef.current.contains(target);
      const clickedOutsideDropdown = dropdownRef.current && !dropdownRef.current.contains(target);

      if (mentionState.isActive && clickedOutsideTextarea && clickedOutsideDropdown) {
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
        value={displayValue}
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
        containerRef={dropdownRef}
        selectedIndex={selectedMentionIndex}
      />
    </div>
  );
};