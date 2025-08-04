import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MentionExtraction {
  mentionedUserIds: string[];
  displayNames: string[];
}

export const useMentionUtils = () => {
  const extractMentionsFromContent = useCallback(async (content: string): Promise<MentionExtraction> => {
    console.log('🔍 extractMentionsFromContent called with:', content);
    
    // Extract user IDs from content - match @{userId:actual-uuid} format
    const mentionPattern = /@\{userId:([^}]+)\}/g;
    const mentions = [...content.matchAll(mentionPattern)];
    
    console.log('🔍 Mention pattern matches:', mentions);
    
    if (!mentions || mentions.length === 0) {
      console.log('❌ No mentions found');
      return { mentionedUserIds: [], displayNames: [] };
    }

    try {
      // Extract user IDs directly from the stored format
      const mentionedUserIds = mentions.map(match => match[1]);
      
      console.log('✅ Extracted user IDs:', mentionedUserIds);
      
      // Get display names for the user IDs
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', mentionedUserIds);

      console.log('👥 Profile lookup result:', { profiles, error });

      if (error) {
        console.error('Error fetching mentioned user profiles:', error);
        return { mentionedUserIds, displayNames: [] };
      }

      // Extract display names from matched profiles
      const displayNames = (profiles || []).map(profile => profile.full_name || 'Unknown User');
      
      console.log('✅ Final extraction result:', { mentionedUserIds, displayNames });
      
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