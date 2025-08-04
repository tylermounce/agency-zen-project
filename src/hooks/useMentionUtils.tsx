import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MentionExtraction {
  mentionedUserIds: string[];
  displayNames: string[];
}

export const useMentionUtils = () => {
  const extractMentionsFromContent = useCallback(async (content: string): Promise<MentionExtraction> => {
    // Extract mentioned display names from content - match full names with spaces
    const mentionPattern = /@([^@]+?)(?=\s|$|@)/g;
    const mentions = content.match(mentionPattern);
    
    if (!mentions || mentions.length === 0) {
      return { mentionedUserIds: [], displayNames: [] };
    }

    try {
      // Get display names by removing @ and trimming
      const displayNames = mentions.map(mention => mention.substring(1).trim());
      
      // Get user IDs for mentioned users by their full names
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('full_name', displayNames);

      if (error) {
        console.error('Error fetching mentioned user profiles:', error);
        return { mentionedUserIds: [], displayNames };
      }

      // Extract user IDs from matched profiles
      const mentionedUserIds = (profiles || []).map(profile => profile.id);
      
      return { mentionedUserIds, displayNames };
    } catch (error) {
      console.error('Error extracting mentions:', error);
      return { mentionedUserIds: [], displayNames: [] };
    }
  }, []);

  const getUserDisplayNameById = useCallback(async (userId: string): Promise<string | null> => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      return profile?.full_name || null;
    } catch (error) {
      console.error('Error getting user display name:', error);
      return null;
    }
  }, []);

  return {
    extractMentionsFromContent,
    getUserDisplayNameById
  };
};