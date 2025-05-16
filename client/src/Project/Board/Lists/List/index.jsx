import React, { memo, useEffect } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { Droppable } from 'react-beautiful-dnd';
import { intersection } from 'lodash';
import { IssueStatusCopy } from 'shared/constants/issues';
import Issue from './Issue';
import { List, Title, IssuesCount, Issues } from './Styles';

const propTypes = {
  status: PropTypes.string.isRequired,
  issues: PropTypes.array.isRequired,
  projectUsers: PropTypes.array.isRequired,
  filters: PropTypes.object.isRequired,
  currentUserId: PropTypes.string,
};

const defaultProps = {
  currentUserId: null,
};

const filterIssues = (issues, filters, currentUserId) => {
  const { searchTerm, userIds, myOnly, recent } = filters;
  let filteredIssues = [...issues];
  
  if (searchTerm) {
    filteredIssues = filteredIssues.filter(issue => 
      issue.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
  
  if (userIds && userIds.length > 0) {
    filteredIssues = filteredIssues.filter(issue => 
      issue.userIds && intersection(
        issue.userIds.map(id => String(id)), 
        userIds.map(id => String(id))
      ).length > 0
    );
  }
  
  if (myOnly && currentUserId) {
    filteredIssues = filteredIssues.filter(issue => 
      issue.userIds && issue.userIds.map(id => String(id)).includes(String(currentUserId))
    );
  }
  
  if (recent) {
    filteredIssues = filteredIssues.filter(issue => 
      issue.updatedAt && moment(issue.updatedAt).isAfter(moment().subtract(3, 'days'))
    );
  }
  
  return filteredIssues;
};

const getSortedListIssues = (issues, status) => {
  // Make sure we're working with an array
  if (!Array.isArray(issues)) {
    console.error('Issues is not an array:', issues);
    return [];
  }
  
  // Log every issue with this status
  const statusIssues = issues.filter(issue => issue.status === status);
  console.log(`Issues with status ${status}:`, statusIssues);
  
  return statusIssues.sort((a, b) => (a.listPosition || 0) - (b.listPosition || 0));
};

const formatIssuesCount = (allListIssues, filteredListIssues) => {
  if (allListIssues.length !== filteredListIssues.length) {
    return `${filteredListIssues.length} of ${allListIssues.length}`;
  }
  return allListIssues.length;
};

const ProjectBoardList = ({ status, issues, projectUsers, filters, currentUserId }) => {
  // Debug logging
  useEffect(() => {
    console.log(`List component for status "${status}" received:`, { 
      issuesCount: issues.length,
      status,
      filters
    });
  }, [status, issues, filters]);
  
  // Filter issues based on the provided filters and current status
  const filteredIssues = filterIssues(issues, filters, currentUserId);
  const filteredListIssues = getSortedListIssues(filteredIssues, status);
  const allListIssues = getSortedListIssues(issues, status);
  
  // Debug - log count after filtering
  useEffect(() => {
    console.log(`Status "${status}" has ${allListIssues.length} issues, ${filteredListIssues.length} after filtering`);
  }, [status, allListIssues.length, filteredListIssues.length]);
  
  return (
    <Droppable key={status} droppableId={status}>
      {provided => (
        <List>
          <Title>
            {`${IssueStatusCopy[status]} `}
            <IssuesCount>{formatIssuesCount(allListIssues, filteredListIssues)}</IssuesCount>
          </Title>
          <Issues
            {...provided.droppableProps}
            ref={provided.innerRef}
            data-testid={`board-list:${status}`}
          >
            {filteredListIssues.map((issue, index) => (
              <Issue 
                key={issue.id} 
                projectUsers={projectUsers} 
                issue={issue} 
                index={index} 
              />
            ))}
            {provided.placeholder}
          </Issues>
        </List>
      )}
    </Droppable>
  );
};

ProjectBoardList.propTypes = propTypes;
ProjectBoardList.defaultProps = defaultProps;

export default memo(ProjectBoardList);