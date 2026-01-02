import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MentionExtraction {
  mentionedUserIds: string[];
  displayNames: string[];
}

// Cache for profile lookups to avoid repeated queries
const profileCache = new Map<string, string>();

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

      // Check cache first
      const uncachedIds = mentionedUserIds.filter(id => !profileCache.has(id));

      if (uncachedIds.length > 0) {
        // Get display names for uncached user IDs
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', uncachedIds);

        if (error) {
          console.error('Error fetching mentioned user profiles:', error);
          return { mentionedUserIds, displayNames: [] };
        }

        // Update cache
        (profiles || []).forEach(profile => {
          profileCache.set(profile.id, profile.full_name || 'Unknown User');
        });
      }

      // Get display names from cache
      const displayNames = mentionedUserIds.map(id =>
        profileCache.get(id) || 'Unknown User'
      );

      return { mentionedUserIds, displayNames };
    } catch (error) {
      console.error('Error extracting mentions:', error);
      return { mentionedUserIds: [], displayNames: [] };
    }
  }, []);

  const getUserDisplayNameById = useCallback(async (userId: string): Promise<string | null> => {
    // Check cache first
    if (profileCache.has(userId)) {
      return profileCache.get(userId) || null;
    }

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

      const displayName = profile?.full_name || null;
      if (displayName) {
        profileCache.set(userId, displayName);
      }
      return displayName;
    } catch (error) {
      console.error('Error getting user display name:', error);
      return null;
    }
  }, []);

  // Clear cache (useful when profiles update)
  const clearProfileCache = useCallback(() => {
    profileCache.clear();
  }, []);

  return {
    extractMentionsFromContent,
    getUserDisplayNameById,
    clearProfileCache
  };
};
