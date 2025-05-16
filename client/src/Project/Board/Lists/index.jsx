import React, { useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { DragDropContext } from 'react-beautiful-dnd';
import useCurrentUser from 'shared/hooks/currentUser';
import { moveItemWithinArray, insertItemIntoArray } from 'shared/utils/javascript';
import { IssueStatus } from 'shared/constants/issues';
import List from './List';
import { Lists } from './Styles';
import supabase from 'config/supaBaseConfig';

const propTypes = {
  project: PropTypes.object.isRequired,
  issues: PropTypes.array.isRequired,
  filters: PropTypes.object.isRequired,
  updateLocalProjectIssues: PropTypes.func.isRequired,
  fetchIssues: PropTypes.func.isRequired,
  isIssuesLoading: PropTypes.bool,
};

const defaultProps = {
  isIssuesLoading: false,
};

const isPositionChanged = (source, destination) => {
  if (!destination) return false;
  const isSameList = destination.droppableId === source.droppableId;
  const isSamePosition = destination.index === source.index;
  return !isSameList || !isSamePosition;
};

const getSortedListIssues = (issues, status) =>
  issues
    .filter(issue => issue.status === status)
    .sort((a, b) => (a.listPosition || 0) - (b.listPosition || 0));

const getAfterDropPrevNextIssue = (allIssues, destination, source, droppedIssueId) => {
  const beforeDropDestinationIssues = getSortedListIssues(allIssues, destination.droppableId);
  const droppedIssue = allIssues.find(issue => String(issue.id) === String(droppedIssueId));
  
  if (!droppedIssue) {
    console.error('Dropped issue not found:', droppedIssueId);
    return { prevIssue: null, nextIssue: null };
  }
  
  const isSameList = destination.droppableId === source.droppableId;
  
  const afterDropDestinationIssues = isSameList
    ? moveItemWithinArray(beforeDropDestinationIssues, droppedIssue, destination.index)
    : insertItemIntoArray(beforeDropDestinationIssues, droppedIssue, destination.index);
  
  return {
    prevIssue: afterDropDestinationIssues[destination.index - 1] || null,
    nextIssue: afterDropDestinationIssues[destination.index + 1] || null,
  };
};

const calculateIssueListPosition = (allIssues, destination, source, droppedIssueId) => {
  const { prevIssue, nextIssue } = getAfterDropPrevNextIssue(
    allIssues, 
    destination, 
    source, 
    droppedIssueId
  );
  
  let position;
  
  if (!prevIssue && !nextIssue) {
    position = 1;
  } else if (!prevIssue) {
    position = (nextIssue.listPosition || 0) - 1;
  } else if (!nextIssue) {
    position = (prevIssue.listPosition || 0) + 1;
  } else {
    position = (prevIssue.listPosition || 0) + 
      ((nextIssue.listPosition || 0) - (prevIssue.listPosition || 0)) / 2;
  }
  
  return position;
};

const ProjectBoardLists = ({ 
  project, 
  issues, 
  filters, 
  updateLocalProjectIssues,
  fetchIssues,
  isIssuesLoading
}) => {
  const { currentUserId } = useCurrentUser();
  const [isDragging, setIsDragging] = useState(false);
  const [dragError, setDragError] = useState(null);

  // Debug - log issues array when it changes
  useEffect(() => {
    console.log('Issues in ProjectBoardLists:', issues);
    if (issues.length > 0) {
      // Count issues by status
      const statusCounts = {};
      Object.values(IssueStatus).forEach(status => {
        statusCounts[status] = issues.filter(issue => issue.status === status).length;
      });
      console.log('Issues by status:', statusCounts);
    }
  }, [issues]);

  // Clear error after a few seconds
  useEffect(() => {
    if (dragError) {
      const timer = setTimeout(() => setDragError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [dragError]);

  const handleIssueDrop = useCallback(async ({ draggableId, destination, source }) => {
    if (!isPositionChanged(source, destination)) return;

    const issueId = draggableId;
    setIsDragging(true);
    setDragError(null);
    
    try {
      // Calculate new position
      const listPosition = calculateIssueListPosition(issues, destination, source, issueId);
      const newStatus = destination.droppableId;
      
      // Find the current issue for reference
      const currentIssue = issues.find(issue => String(issue.id) === String(issueId));
      if (!currentIssue) {
        throw new Error('Issue not found');
      }
      
      // 1. Update the local state immediately for better UX
      const updatedFields = {
        status: newStatus,
        listPosition: listPosition
      };
      
      updateLocalProjectIssues(issueId, updatedFields);
      
      // 2. Update the database directly with Supabase
      const numericIssueId = parseInt(issueId, 10);
      
      console.log(`Updating issue ${numericIssueId} in database:`, updatedFields);
      
      const { error } = await supabase
        .from('issue')
        .update({
          status: newStatus,
          listPosition: listPosition,
          updated_at: new Date().toISOString()
        })
        .eq('id', numericIssueId);
      
      if (error) {
        throw new Error(`Database update failed: ${error.message}`);
      }
      
      console.log(`Issue ${issueId} successfully moved to ${newStatus}`);
      
      // 3. Fetch updated issues after a short delay
      setTimeout(() => {
        fetchIssues(true);
      }, 1000);
      
    } catch (error) {
      console.error('Error updating issue position:', error);
      setDragError(error.message || 'Failed to update issue');
      
      // Fetch issues to ensure UI is in sync with server
      fetchIssues(true);
    } finally {
      setIsDragging(false);
    }
  }, [issues, updateLocalProjectIssues, fetchIssues]);

  return (
    <DragDropContext onDragEnd={handleIssueDrop}>
      {dragError && (
        <div style={{ 
          backgroundColor: '#FFEBEE', 
          color: '#D32F2F', 
          padding: '10px', 
          borderRadius: '3px',
          margin: '10px 0',
          fontSize: '14px'
        }}>
          Error: {dragError}
        </div>
      )}
      
      {isIssuesLoading && (
        <div style={{ 
          backgroundColor: '#E3F2FD', 
          color: '#1976D2', 
          padding: '10px', 
          borderRadius: '3px',
          margin: '10px 0',
          fontSize: '14px'
        }}>
          Synchronizing issues...
        </div>
      )}
      
      <Lists isDragging={isDragging}>
        {Object.values(IssueStatus).map(status => (
          <List
            key={status}
            status={status}
            issues={issues}
            projectUsers={project.users || []}
            filters={filters}
            currentUserId={currentUserId}
          />
        ))}
      </Lists>
    </DragDropContext>
  );
};

ProjectBoardLists.propTypes = propTypes;
ProjectBoardLists.defaultProps = defaultProps;

// Export the component with memoization to prevent unnecessary re-renders
export default React.memo(ProjectBoardLists);