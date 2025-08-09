import { useAuth } from '../auth/auth-context';
import { UserRole } from '../types/user';
import { useEffect } from 'react';

export function useAdmin() {
  const { customUser, user, refreshUserData } = useAuth();
  
  // Get user role from customUser (API data)
  const userRole = customUser?.role;
  
  // Debug logging
  useEffect(() => {
    if (user && !customUser) {
      console.log('useAdmin: User exists but customUser is missing, triggering refresh');
      refreshUserData();
    }
  }, [user, customUser, refreshUserData]);
  
  // Check roles based on database enum values
  const isAdmin = userRole === UserRole.ADMIN;
  const isModerator = userRole === UserRole.MODERATOR;
  const isOrganizer = userRole === UserRole.ORGANIZER;
  const isCommentator = userRole === UserRole.COMMENTATOR;

  // Debug logging for role checks
  useEffect(() => {
    if (customUser) {
      console.log('useAdmin: Current user role:', userRole, 'isAdmin:', isAdmin);
    }
  }, [customUser, userRole, isAdmin]);

  return {
    isAdmin,
    isModerator,
    isOrganizer,
    isCommentator,
    canCreateTournament: isAdmin || isOrganizer,
    canEditTournament: isAdmin || isOrganizer,
    canDeleteTournament: isAdmin,
    canManageTournaments: isAdmin || isModerator,
    canManageUsers: isAdmin,
    canModerateContent: isAdmin || isModerator,
    canViewAnalytics: isAdmin || isModerator || isOrganizer,
    // Additional debugging info
    userRole,
    hasCustomUser: !!customUser,
  };
}