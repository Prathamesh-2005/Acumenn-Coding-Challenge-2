import React, { memo, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useRouteMatch } from 'react-router-dom';
import { Draggable } from 'react-beautiful-dnd';
import { IssueTypeIcon, IssuePriorityIcon } from 'shared/components';
import { IssueLink, Issue, Title, Bottom, Assignees, AssigneeAvatar } from './Styles';

const propTypes = {
  projectUsers: PropTypes.array.isRequired,
  issue: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
};

const ProjectBoardListIssue = ({ projectUsers, issue, index }) => {
  const match = useRouteMatch();
  
  // Debug - log issue data when component mounts or issue changes
  useEffect(() => {
    console.log(`Rendering issue ${issue.id}:`, { 
      title: issue.title, 
      status: issue.status,
      index
    });
  }, [issue, index]);
  
  // Ensure issue id is a string to avoid issues with draggableId
  const issueId = issue.id ? String(issue.id) : '';
  
  // Ensure userIds exists and is an array before mapping
  const userIds = issue.userIds || [];
  const assignees = userIds.map(userId => 
    projectUsers.find(user => user && String(user.id) === String(userId))
  ).filter(Boolean); // Filter out undefined values
  
  // Function to map issue type to valid icon types
  const getValidIconType = (type) => {
    // Map the issue type to the valid icon types expected by the Icon component
    const typeMap = {
      'Bug': 'bug',
      'Task': 'task',
      'Story': 'story',
      'Feature': 'task', // Map to valid type
      'Epic': 'story'
    };
    
    return typeMap[type] || 'task'; // Default to 'task' if type not found in mapping
  };
  
  // Check if issue is valid before rendering
  if (!issue || !issueId) {
    console.error('Invalid issue object:', issue);
    return null;
  }
  
  return (
    <Draggable draggableId={issueId} index={index}>
      {(provided, snapshot) => (
        <IssueLink
          to={`${match.url}/issues/${issueId}`}
          ref={provided.innerRef}
          data-testid="list-issue"
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          <Issue isBeingDragged={snapshot.isDragging && !snapshot.isDropAnimating}>
            <Title>{issue.title}</Title>
            <Bottom>
              <div>
                <IssueTypeIcon type={getValidIconType(issue.type)} />
                <IssuePriorityIcon priority={issue.priority} top={-1} left={4} />
              </div>
              <Assignees>
                {assignees.map(user => (
                  <AssigneeAvatar
                    key={user.id}
                    size={24}
                    avatarUrl={user.avatarUrl}
                    name={user.name}
                  />
                ))}
              </Assignees>
            </Bottom>
          </Issue>
        </IssueLink>
      )}
    </Draggable>
  );
};

ProjectBoardListIssue.propTypes = propTypes;

export default memo(ProjectBoardListIssue);