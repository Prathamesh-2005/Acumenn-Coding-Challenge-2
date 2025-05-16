import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { xor } from 'lodash';
import supabase from 'config/supaBaseConfig';
import useCurrentUser from 'shared/hooks/currentUser';
import {
  Filters,
  SearchInput,
  Avatars,
  AvatarIsActiveBorder,
  StyledAvatar,
  StyledButton,
  ClearAll,
} from './Styles';

const propTypes = {
  projectUsers: PropTypes.array.isRequired,
  defaultFilters: PropTypes.object.isRequired,
  filters: PropTypes.object.isRequired,
  mergeFilters: PropTypes.func.isRequired,
};

const ProjectBoardFilters = ({ projectUsers, defaultFilters, filters, mergeFilters }) => {
  const { searchTerm, userIds, myOnly, recent } = filters;
  const { currentUserId } = useCurrentUser();
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState([]);
  
  // Fetch users if not provided by projectUsers prop
  useEffect(() => {
    const fetchUsers = async () => {
      // If we already have projectUsers populated, don't fetch again
      if (projectUsers && projectUsers.length > 0) {
        setUsers(projectUsers);
        return;
      }

      try {
        setIsLoading(true);
        
        // Get the project id - this assumes the first user's projectId is the current project
        const projectId = projectUsers[0]?.projectId || null;
        
        if (!projectId) {
          console.warn('No project ID available to fetch users');
          return;
        }
        
        // Convert project ID to number if it's a string
        const numericProjectId = typeof projectId === 'string' 
          ? parseInt(projectId, 10) 
          : projectId;
        
        const { data, error } = await supabase
          .from('user')
          .select('*')
          .eq('projectId', numericProjectId);
        
        if (error) {
          console.error('Error fetching project users:', error);
          return;
        }
        
        // Format users to ensure consistency
        const formattedUsers = (data || []).map(user => ({
          ...user,
          id: user.id, // UUID is already a string
          projectId: String(user.projectId)
        }));
        
        setUsers(formattedUsers);
      } catch (err) {
        console.error('Failed to fetch project users:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Only fetch if we need to
    if (projectUsers.length === 0) {
      fetchUsers();
    } else {
      setUsers(projectUsers);
    }
  }, [projectUsers]);
  
  // Handle filter application for myOnly filter
  const handleMyIssuesToggle = async () => {
    // Toggle the myOnly filter
    const newMyOnly = !myOnly;
    
    // If turning on myOnly filter, ensure we have the current user's ID
    if (newMyOnly && !currentUserId) {
      console.warn('Cannot filter by current user: no user ID available');
      return;
    }
    
    mergeFilters({ myOnly: newMyOnly });
  };
  
  // Handle filter application for recently updated
  const handleRecentToggle = () => {
    mergeFilters({ recent: !recent });
  };
  
  const areFiltersCleared = !searchTerm && userIds.length === 0 && !myOnly && !recent;
  
  // Display users when they're loaded
  const displayUsers = users.length > 0 ? users : projectUsers;
  
  return (
    <Filters data-testid="board-filters">
      <SearchInput
        icon="search"
        value={searchTerm}
        onChange={value => mergeFilters({ searchTerm: value })}
        placeholder="Search issues..."
      />
      <Avatars>
        {displayUsers.map(user => (
          <AvatarIsActiveBorder key={user.id} isActive={userIds.includes(user.id)}>
            <StyledAvatar
              avatarUrl={user.avatarUrl}
              name={user.name}
              onClick={() => mergeFilters({ userIds: xor(userIds, [user.id]) })}
            />
          </AvatarIsActiveBorder>
        ))}
      </Avatars>
      <StyledButton
        variant="empty"
        isActive={myOnly}
        onClick={handleMyIssuesToggle}
      >
        Only My Issues
      </StyledButton>
      <StyledButton
        variant="empty"
        isActive={recent}
        onClick={handleRecentToggle}
      >
        Recently Updated
      </StyledButton>
      {!areFiltersCleared && (
        <ClearAll onClick={() => mergeFilters(defaultFilters)}>Clear all</ClearAll>
      )}
    </Filters>
  );
};

ProjectBoardFilters.propTypes = propTypes;

export default ProjectBoardFilters;