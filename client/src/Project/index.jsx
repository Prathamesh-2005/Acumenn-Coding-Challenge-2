import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Route, Redirect, useRouteMatch, useHistory } from 'react-router-dom';
import { updateArrayItemById } from 'shared/utils/javascript';
import { createQueryParamModalHelpers } from 'shared/utils/queryParamModal';
import { PageLoader, PageError, Modal } from 'shared/components';
import NavbarLeft from './NavbarLeft';
import Sidebar from './Sidebar';
import ProjectBoard from './Board';
import IssueSearch from './IssueSearch';
import IssueCreate from './IssueCreate';
import ProjectSettings from './ProjectSettings';
import { ProjectPage } from './Styles';
import supabase from '../config/supaBaseConfig';
import useCurrentUser from 'shared/hooks/currentUser';

const Project = () => {
  const match = useRouteMatch();
  const history = useHistory();
  const issueSearchModalHelpers = createQueryParamModalHelpers('issue-search');
  const issueCreateModalHelpers = createQueryParamModalHelpers('issue-create');
  const { currentUser, currentUserId } = useCurrentUser();

  const [project, setProject] = useState(null);
  const [issues, setIssues] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isIssuesLoading, setIsIssuesLoading] = useState(false);
  
  // Use refs to prevent duplicate fetches and maintain fetch state
  const fetchingProjectRef = useRef(false);
  const fetchingIssuesRef = useRef(false);
  const projectIdRef = useRef(null);
  const dataInitializedRef = useRef(false);
  const lastProjectFetchTimeRef = useRef(0);
  const lastIssuesFetchTimeRef = useRef(0);
  const componentMountedRef = useRef(true);

  // Fetch project data with throttling
  const fetchProject = useCallback(async (forceFetch = false) => {
    // Skip if already fetching or component unmounted
    if ((fetchingProjectRef.current && !forceFetch) || !componentMountedRef.current) {
      console.log('Skipping project fetch: already fetching or component unmounted');
      return project;
    }
    
    // Implement throttling to prevent rapid consecutive calls
    const now = Date.now();
    const minInterval = 2000; // 2 seconds minimum between fetches
    
    if (!forceFetch && now - lastProjectFetchTimeRef.current < minInterval) {
      console.log('Throttling project fetch - too soon after last fetch');
      return project;
    }
    
    lastProjectFetchTimeRef.current = now;
    
    // Don't set loading if we already have project data (for refreshes)
    const shouldSetLoading = !project && !forceFetch;
    
    try {
      fetchingProjectRef.current = true;
      if (shouldSetLoading && componentMountedRef.current) setLoading(true);
      
      // If we have currentUser data, use it directly
      let projectId = null;
      
      if (currentUser?.projectId) {
        projectId = currentUser.projectId;
      } else {
        // Otherwise fetch from the database
        // Get the user's project ID
        const { data: userRow, error: userError } = await supabase
          .from('user')
          .select('projectId')
          .eq('id', currentUserId)
          .single();
        
        if (userError) {
          throw new Error(userError.message || 'Failed to fetch user data');
        }
        
        if (!userRow || !userRow.projectId) {
          throw new Error('No project assigned to this user');
        }
        
        projectId = userRow.projectId;
      }
      
      // Fetch the project details
      const { data: projectData, error: projectError } = await supabase
        .from('project')
        .select('*, users:user(*)')
        .eq('id', projectId)
        .single();
      
      if (projectError) {
        throw new Error(projectError.message || 'Failed to fetch project data');
      }
      
      if (!projectData) {
        throw new Error('Project not found');
      }
      
      // Store project ID in ref for issue fetching
      projectIdRef.current = projectData.id;
      
      // Format project data
      const formattedProject = {
        ...projectData,
        id: String(projectData.id),
        users: Array.isArray(projectData.users) ? projectData.users : []
      };
      
      // Only update state if component is still mounted
      if (componentMountedRef.current) {
        setProject(formattedProject);
      }
      
      return formattedProject;
    } catch (err) {
      console.error('Error fetching project:', err);
      
      // Only update state if component is still mounted
      if (componentMountedRef.current) {
        setError(err.message || 'An unknown error occurred');
      }
      
      return null;
    } finally {
      fetchingProjectRef.current = false;
      
      // Only update state if component is still mounted
      if (componentMountedRef.current && shouldSetLoading) {
        setLoading(false);
      }
    }
  }, [project, currentUser, currentUserId]);

  // Fetch issues for current project with throttling
  const fetchIssues = useCallback(async (forceFetch = false) => {
    // Skip if already fetching or component unmounted
    if ((fetchingIssuesRef.current && !forceFetch) || !componentMountedRef.current) {
      console.log('Skipping issues fetch: already fetching or component unmounted');
      return;
    }
    
    // Implement throttling to prevent rapid consecutive calls
    const now = Date.now();
    const minInterval = 2000; // 2 seconds minimum between fetches
    
    if (!forceFetch && now - lastIssuesFetchTimeRef.current < minInterval) {
      console.log('Throttling issues fetch - too soon after last fetch');
      return;
    }
    
    lastIssuesFetchTimeRef.current = now;
    
    const projectId = projectIdRef.current || project?.id;
    
    if (!projectId) {
      console.warn('Cannot fetch issues: No project ID available');
      return;
    }
    
    try {
      fetchingIssuesRef.current = true;
      
      // Only update loading state if component is still mounted
      if (componentMountedRef.current) {
        setIsIssuesLoading(true);
      }
      
      // Convert ID to number if needed
      const numericProjectId = typeof projectId === 'string' 
        ? parseInt(projectId, 10) 
        : projectId;
      
      console.log(`Fetching issues for project ${numericProjectId}`);
      
      const { data: issuesData, error: issuesError } = await supabase
        .from('issue')
        .select('*')
        .eq('projectId', numericProjectId);
      
      if (issuesError) {
        throw new Error(issuesError.message || 'Failed to fetch issues');
      }
      
      // Format issues with string IDs
      const formattedIssues = (issuesData || []).map(issue => ({
        ...issue,
        id: String(issue.id),
        projectId: String(issue.projectId),
        userIds: Array.isArray(issue.userIds) ? issue.userIds : []
      }));
      
      console.log(`Fetched ${formattedIssues.length} issues`);
      
      // Only update state if component is still mounted
      if (componentMountedRef.current) {
        setIssues(formattedIssues);
      }
    } catch (err) {
      console.error('Error fetching issues:', err);
      // Don't set global error to avoid hiding the entire project
    } finally {
      fetchingIssuesRef.current = false;
      
      // Only update state if component is still mounted
      if (componentMountedRef.current) {
        setIsIssuesLoading(false);
      }
    }
  }, [project?.id]);

  // Initialize data on first render
  useEffect(() => {
    componentMountedRef.current = true;
    
    if (dataInitializedRef.current) return;
    
    const initializeData = async () => {
      try {
        if (!project) {
          const projectData = await fetchProject(true);
          
          if (projectData && !dataInitializedRef.current) {
            await fetchIssues(true);
            dataInitializedRef.current = true;
          }
        } else if (!issues.length && !dataInitializedRef.current) {
          await fetchIssues(true);
          dataInitializedRef.current = true;
        }
      } catch (err) {
        console.error('Failed to initialize data:', err);
      }
    };
    
    // Only initialize if we have currentUserId
    if (currentUserId) {
      initializeData();
    }
    
    // Clean up on unmount
    return () => {
      componentMountedRef.current = false;
    };
  }, [fetchProject, fetchIssues, currentUserId, project, issues.length]);

  // Method to update issues locally (for optimistic updates)
  const updateLocalProjectIssues = useCallback((updaterOrId, updatedFields) => {
    // Case 1: First argument is a function (setState updater pattern)
    if (typeof updaterOrId === 'function') {
      setIssues(updaterOrId);
    } 
    // Case 2: Traditional pattern with id and fields
    else {
      setIssues(currentIssues => {
        return updateArrayItemById(currentIssues, updaterOrId, updatedFields);
      });
    }
  }, []);

  // Display loading state
  if (loading && !project) {
    return <PageLoader message="Loading project..." />;
  }

  // Display error state
  if (error) {
    return <PageError message={error} />;
  }

  // Ensure we have project data
  if (!project) {
    return <PageLoader message="Initializing project..." />;
  }

  return (
    <ProjectPage>
      <NavbarLeft
        issueSearchModalOpen={issueSearchModalHelpers.open}
        issueCreateModalOpen={issueCreateModalHelpers.open}
      />
      <Sidebar project={project} />

      {issueSearchModalHelpers.isOpen() && (
        <Modal
          isOpen
          testid="modal:issue-search"
          variant="aside"
          width={600}
          onClose={issueSearchModalHelpers.close}
          renderContent={() => <IssueSearch project={project} />}
        />
      )}

      {issueCreateModalHelpers.isOpen() && (
        <Modal
          isOpen
          testid="modal:issue-create"
          width={800}
          withCloseIcon={false}
          onClose={issueCreateModalHelpers.close}
          renderContent={(modal) => (
            <IssueCreate
              project={project}
              fetchProject={fetchProject}
              fetchIssues={fetchIssues}
              updateLocalProjectIssues={updateLocalProjectIssues}
              onCreate={(newIssue) => {
                // Ensure the new issue is added to the local state
                if (newIssue && !issues.some(issue => issue.id === newIssue.id)) {
                  setIssues(currentIssues => [newIssue, ...currentIssues]);
                }
                history.push(`${match.url}/board`);
              }}
              modalClose={modal.close}
            />
          )}
        />
      )}

      <Route
        path={`${match.path}/board`}
        render={() => (
          <ProjectBoard
            project={project}
            fetchProject={fetchProject}
            fetchIssues={fetchIssues}
            issues={issues}
            isIssuesLoading={isIssuesLoading}
            updateLocalProjectIssues={updateLocalProjectIssues}
          />
        )}
      />

      <Route
        path={`${match.path}/settings`}
        render={() => <ProjectSettings project={project} fetchProject={fetchProject} />}
      />

      {match.isExact && <Redirect to={`${match.url}/board`} />}
    </ProjectPage>
  );
};

export default Project;
