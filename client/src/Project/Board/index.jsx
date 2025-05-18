import React, { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Route, useRouteMatch, useHistory } from 'react-router-dom';
import useMergeState from 'shared/hooks/mergeState';
import { Breadcrumbs, Modal, PageLoader, PageError } from 'shared/components';
import Header from './Header';
import Filters from './Filters';
import Lists from './Lists';
import IssueDetails from './IssueDetails';

const propTypes = {
  project: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string,
    users: PropTypes.array,
  }).isRequired,
  fetchProject: PropTypes.func.isRequired,
  fetchIssues: PropTypes.func.isRequired,
  issues: PropTypes.array.isRequired,
  isIssuesLoading: PropTypes.bool,
  updateLocalProjectIssues: PropTypes.func.isRequired,
};

const defaultProps = {
  isIssuesLoading: false,
};

const defaultFilters = {
  searchTerm: '',
  userIds: [],
  myOnly: false,
  recent: false,
};

const ProjectBoard = ({ 
  project, 
  fetchProject, 
  fetchIssues, 
  issues, 
  isIssuesLoading, 
  updateLocalProjectIssues 
}) => {
  const match = useRouteMatch();
  const history = useHistory();
  
  // State management
  const [filters, mergeFilters] = useMergeState(defaultFilters);
  const [error, setError] = useState(null);
  const [localLoading, setLocalLoading] = useState(false);
  const [dragInProgress, setDragInProgress] = useState(false);
  
  // Track newly created issue IDs to ensure they're displayed immediately
  const [newlyCreatedIssueId, setNewlyCreatedIssueId] = useState(null);
  
  // Refs to prevent duplicate operations
  const hasInitializedRef = useRef(false);
  const isRefreshingRef = useRef(false);
  const componentMountedRef = useRef(true);
  const lastRefreshTimeRef = useRef(0);
  
  // Wrapped fetchIssues to prevent infinite loops with throttling
  const safelyFetchIssues = useCallback(async (force = false) => {
    // Skip if already refreshing
    if (isRefreshingRef.current) {
      console.log('Already refreshing issues, skipping duplicate request');
      return;
    }
    
    // Skip if drag is in progress to prevent flickering during drag operations
    if (dragInProgress && !force) {
      console.log('Drag in progress, delaying refresh');
      return;
    }
    
    // Implement throttling to prevent rapid consecutive calls
    const now = Date.now();
    const minInterval = 3000; // 3 seconds minimum between refreshes
    
    if (!force && now - lastRefreshTimeRef.current < minInterval) {
      console.log('Throttling issues refresh - too soon after last refresh');
      return;
    }
    
    try {
      isRefreshingRef.current = true;
      if (componentMountedRef.current) {
        setLocalLoading(true);
      }
      
      lastRefreshTimeRef.current = now;
      await fetchIssues(force);
      
      if (componentMountedRef.current) {
        hasInitializedRef.current = true;
      }
    } catch (err) {
      console.error('Failed to refresh issues:', err);
      
      if (componentMountedRef.current) {
        setError('Failed to refresh issues. Please try again.');
      }
    } finally {
      isRefreshingRef.current = false;
      
      if (componentMountedRef.current) {
        setLocalLoading(false);
      }
    }
  }, [fetchIssues, dragInProgress]);
  
  // Enhanced update local issues function that properly handles updates and deletions
  const enhancedUpdateLocalProjectIssues = useCallback((issueIdOrUpdaterOrNewIssue, updatedFields = null) => {
    // Case 1: Function updater pattern (for filtering operations)
    if (typeof issueIdOrUpdaterOrNewIssue === 'function') {
      updateLocalProjectIssues(issueIdOrUpdaterOrNewIssue);
      return;
    }
    
    // Case 2: If updatedFields is null, it means we're deleting the issue
    if (updatedFields === null) {
      const issueId = issueIdOrUpdaterOrNewIssue;
      
      // Handle deletion by passing a filter function to the parent
      updateLocalProjectIssues(currentIssues => {
        return Array.isArray(currentIssues) 
          ? currentIssues.filter(issue => issue.id !== issueId)
          : [];
      });
      
      // If we're currently viewing the issue being deleted, redirect to the board
      const pathname = window.location.pathname;
      if (pathname.includes(`/issues/${issueId}`)) {
        history.push(match.url);
      }
      return;
    } 
    // Case 3: New issue object
    else if (typeof issueIdOrUpdaterOrNewIssue === 'object' && issueIdOrUpdaterOrNewIssue !== null) {
      // This is a completely new issue object
      const newIssue = issueIdOrUpdaterOrNewIssue;
      
      // Track new issue to ensure it's displayed
      setNewlyCreatedIssueId(newIssue.id);
      
      // Add the new issue to the list or update existing one
      updateLocalProjectIssues(newIssue);
      return;
    }
    // Case 4: Update existing issue with ID and fields
    else {
      const issueId = issueIdOrUpdaterOrNewIssue;
      // Pass update to parent component
      updateLocalProjectIssues(issueId, updatedFields);
    }
  }, [updateLocalProjectIssues, history, match.url]);
  
  // Handle drag start and end to prevent unnecessary refreshes during dragging
  const handleDragStatusChange = useCallback((isDragging) => {
    setDragInProgress(isDragging);
  }, []);
  
  // One-time initialization effect
  useEffect(() => {
    componentMountedRef.current = true;
    
    // Skip if already initialized
    if (hasInitializedRef.current) {
      return;
    }
    
    // Skip if we already have issues or are loading
    if (issues.length > 0) {
      hasInitializedRef.current = true;
      return;
    }
    
    // Only load if we have a project ID and there are no issues yet
    if (project?.id && !issues.length && !isIssuesLoading && !hasInitializedRef.current) {
      safelyFetchIssues(true);
    }
    
    // Skip additional initialization if we're already loading
    if (isIssuesLoading) {
      hasInitializedRef.current = true;
    }
    
    // Cleanup on unmount
    return () => {
      componentMountedRef.current = false;
    };
  }, [project?.id, issues.length, isIssuesLoading, safelyFetchIssues]);
  
  // Track issues length changes to detect when data is loaded
  useEffect(() => {
    // If issues have loaded, make sure we mark as initialized
    if (issues.length > 0 && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
    }
  }, [issues.length]);
  
  // Clear newly created issue ID after it's been included in the issues list
  useEffect(() => {
    if (newlyCreatedIssueId && issues.some(issue => issue.id === newlyCreatedIssueId)) {
      // The new issue is now in the list, so we can clear the tracking
      setNewlyCreatedIssueId(null);
    }
  }, [issues, newlyCreatedIssueId]);
  
  // Function to handle refresh button click
  const handleRefreshClick = () => {
    safelyFetchIssues(true);
  };
  
  // Display error message if applicable
  if (error) {
    return (
      <>
        <Breadcrumbs items={['Projects', project?.name || 'Unknown Project', 'Kanban Board']} />
        <PageError 
          message={error}
          actionFn={handleRefreshClick}
          actionText="Try Again"
        />
      </>
    );
  }
  
  // Determine loading state
  const isLoading = isIssuesLoading || localLoading;
  
  // Prepare project data
  const projectName = project?.name || 'Unknown Project';
  const projectUsers = project?.users || [];
  
  return (
    <>
      <Breadcrumbs items={['Projects', projectName, 'Kanban Board']} />
      <Header />
      <Filters
        projectUsers={projectUsers}
        defaultFilters={defaultFilters}
        filters={filters}
        mergeFilters={mergeFilters}
      />
      
      {isLoading && !dragInProgress ? (
        <PageLoader message="Loading issues..." />
      ) : issues.length === 0 ? (
        <div style={{ padding: '20px', border: '1px solid #dfe1e6', borderRadius: '3px', margin: '10px 0' }}>
          <h3>No Issues Found</h3>
          <p>There are currently no issues for this project.</p>
          <p>Project ID: {project.id}</p>
          <button 
            onClick={handleRefreshClick}
            disabled={isRefreshingRef.current}
            style={{ 
              padding: '8px 16px', 
              background: '#0052cc', 
              color: 'white', 
              border: 'none', 
              borderRadius: '3px',
              cursor: 'pointer' 
            }}
          >
            Refresh Issues
          </button>
        </div>
      ) : (
        <Lists
          project={project}
          issues={issues}
          filters={filters}
          updateLocalProjectIssues={enhancedUpdateLocalProjectIssues}
          fetchIssues={safelyFetchIssues}
          isIssuesLoading={isLoading}
          onDragStatusChange={handleDragStatusChange}
        />
      )}

      <Route
        path={`${match.path}/issues/:issueId`}
        render={({ match: routeMatch }) => {
          const issueId = routeMatch.params.issueId;
          if (!issueId) return null;

          return (
            <Modal
              isOpen
              testid="modal:issue-details"
              width={1040}
              withCloseIcon={false}
              onClose={() => history.push(match.url)}
              renderContent={(modal) => (
                <IssueDetails
                  issueId={issueId}
                  projectUsers={projectUsers}
                  fetchProject={fetchProject}
                  fetchIssues={safelyFetchIssues}
                  updateLocalProjectIssues={enhancedUpdateLocalProjectIssues}
                  modalClose={modal.close}
                />
              )}
            />
          );
        }}
      />
    </>
  );
};

ProjectBoard.propTypes = propTypes;
ProjectBoard.defaultProps = defaultProps;

export default ProjectBoard;
