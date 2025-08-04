import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MentionExtraction {
  mentionedUserIds: string[];
  displayNames: string[];
}

export const useMentionUtils = () => {
  const extractMentionsFromContent = useCallback(async (content: string): Promise<MentionExtraction> => {
    // Extract user IDs from content - match @{userId:actual-uuid} format
    const mentionPattern = /@\{userId:([^}]+)\}/g;
    const mentions = [...content.matchAll(mentionPattern)];
    
    if (!mentions || mentions.length === 0) {
      return { mentionedUserIds: [], displayNames: [] };
    }

    try {
      // Extract user IDs directly from the stored format
      const mentionedUserIds = mentions.map(match => match[1]);
      
      // Get display names for the user IDs
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', mentionedUserIds);

      if (error) {
        console.error('Error fetching mentioned user profiles:', error);
        return { mentionedUserIds, displayNames: [] };
      }

      // Extract display names from matched profiles
      const displayNames = (profiles || []).map(profile => profile.full_name || 'Unknown User');
      
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