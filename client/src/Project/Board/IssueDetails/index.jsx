import React, { Fragment, useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import supabase from 'config/supaBaseConfig';
import toast from 'shared/utils/toast';
import { PageError, CopyLinkButton, Button, AboutTooltip } from 'shared/components';

import Loader from './Loader';
import Type from './Type';
import Delete from './Delete';
import Title from './Title';
import Description from './Description';
import Comments from './Comments';
import Status from './Status';
import AssigneesReporter from './AssigneesReporter';
import Priority from './Priority';
import EstimateTracking from './EstimateTracking';
import Dates from './Dates';
import { TopActions, TopActionsRight, Content, Left, Right } from './Styles';

const propTypes = {
  issueId: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number
  ]).isRequired,
  projectUsers: PropTypes.array.isRequired,
  fetchProject: PropTypes.func.isRequired,
  fetchIssues: PropTypes.func.isRequired,
  updateLocalProjectIssues: PropTypes.func.isRequired,
  onIssueDeleted: PropTypes.func.isRequired,
  issues: PropTypes.array.isRequired,
  modalClose: PropTypes.func.isRequired,
};

const ProjectBoardIssueDetails = ({
  issueId,
  projectUsers,
  fetchProject,
  fetchIssues,
  updateLocalProjectIssues,
  onIssueDeleted,
  issues,
  modalClose,
}) => {
  const [issue, setIssue] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchIssue = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch the issue with its related data
      const { data, error: issueError } = await supabase
        .from('issue')
        .select(`
          *,
          reporter:reporterId(*),
          assignee:assigneeId(*)
        `)
        .eq('id', issueId)
        .single();

      if (issueError) throw issueError;
      
      if (!data) {
        throw new Error('Issue not found');
      }

      // Fetch user associations
      const { data: userAssociations, error: userAssociationsError } = await supabase
        .from('issue_users_user')
        .select('user_id')
        .eq('issueId', issueId);

      if (userAssociationsError) throw userAssociationsError;
      
      // Extract user IDs and find matching users from projectUsers
      const userIds = userAssociations?.map(item => item.user_id) || [];
      const users = userIds.map(userId => 
        projectUsers.find(user => user.id === userId)
      ).filter(Boolean);
      
      // Fetch comments for this issue
      const { data: comments, error: commentsError } = await supabase
        .from('comment')
        .select('*, user:userId(*)')
        .eq('issueId', issueId)
        .order('createdAt', { ascending: false });

      if (commentsError) throw commentsError;
      
      // Construct the formatted issue with users and comments
      const formattedIssue = {
        ...data,
        userIds, // Store the raw userIds array
        users,   // Store the full user objects
        comments: comments || []
      };
      
      setIssue(formattedIssue);
      updateLocalProjectIssues(formattedIssue.id, formattedIssue);
    } catch (err) {
      console.error('Error fetching issue details:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [issueId, projectUsers, updateLocalProjectIssues]);

  useEffect(() => {
    if (issueId) {
      fetchIssue();
    }
  }, [issueId, fetchIssue]);

  // Set up realtime subscription for the issue and issue_users_user tables
  useEffect(() => {
    if (!issueId) return;
    
    // Issue table subscription
    const issueSubscription = supabase
      .channel('issue-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'issue',
        filter: `id=eq.${issueId}`
      }, (payload) => {
        console.log('Issue change detected:', payload);
        
        // Handle issue deletion event
        if (payload.eventType === 'DELETE') {
          console.log('Issue was deleted, handling deletion event');
          onIssueDeleted(issueId);
          modalClose();
          return;
        }
        
        // For other changes, refresh the issue
        fetchIssue();
      })
      .subscribe();
      
    // Issue users subscription
    const usersSubscription = supabase
      .channel('issue-users-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'issue_users_user',
        filter: `issueId=eq.${issueId}`
      }, () => {
        console.log('Issue users change detected, refreshing...');
        fetchIssue();
      })
      .subscribe();
      
    // Comments subscription
    const commentsSubscription = supabase
      .channel('issue-comments-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'comment',
        filter: `issueId=eq.${issueId}`
      }, () => {
        console.log('Comment change detected, refreshing...');
        fetchIssue();
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(issueSubscription);
      supabase.removeChannel(usersSubscription);
      supabase.removeChannel(commentsSubscription);
    };
  }, [issueId, fetchIssue, onIssueDeleted, modalClose]);

  const updateIssue = useCallback(async (updatedFields) => {
    try {
      if (!issue) {
        console.error('Cannot update issue: issue is null');
        return;
      }
      
      // Create a new issue object by merging the current issue with updated fields
      const updatedIssue = { ...issue, ...updatedFields };
      
      // Update local state immediately for optimistic UI update
      setIssue(updatedIssue);
      
      // Extract only database-relevant fields (exclude UI-specific fields)
      const dbFields = { ...updatedFields };
      // Remove fields that shouldn't be sent directly to the issue table
      delete dbFields.users;
      delete dbFields.userIds;
      delete dbFields.comments;
      
      // Only update the database if there are actual database fields to update
      // and if they're not being handled by child components directly
      if (Object.keys(dbFields).length > 0 && 
          !updatedFields.hasOwnProperty('_updatedInChild')) {
        // Send the update to Supabase
        const { error: updateError } = await supabase
          .from('issue')
          .update(dbFields)
          .eq('id', issue.id);
        
        if (updateError) throw updateError;
      }
      
      // Update parent component state
      updateLocalProjectIssues(updatedIssue.id, updatedFields);
      
    } catch (err) {
      console.error('Error handling issue update:', err);
      toast.error(err.message || 'Failed to update issue');
      
      // Revert to previous state if error occurs
      fetchIssue();
    }
  }, [issue, updateLocalProjectIssues, fetchIssue]);

  // Handle issue deletion
  const handleIssueDelete = useCallback(async () => {
    try {
      // Check if supabase is properly initialized
      if (!supabase || typeof supabase.from !== 'function') {
        throw new Error('Supabase client is not properly initialized');
      }
      
      const { error } = await supabase
        .from('issue')
        .delete()
        .eq('id', issueId);

      if (error) throw error;
      
      // Notify ProjectBoard about the deletion
      onIssueDeleted(issueId);
      
      // Close the modal
      modalClose();
      
      // Show success message
      toast.success('Issue successfully deleted');
      
      // Refresh project data
      await fetchProject();
      
    } catch (err) {
      console.error('Delete issue error:', err);
      toast.error(`Failed to delete issue: ${err.message}`);
    }
  }, [issueId, onIssueDeleted, modalClose, fetchProject]);

  if (isLoading) return <Loader />;
  if (error) return <PageError message={error.message || 'Error loading issue'} />;
  if (!issue) return <PageError message="Issue not found" />;

  return (
    <Fragment>
      <TopActions>
        <Type issue={issue} updateIssue={updateIssue} />
        <TopActionsRight>
          <AboutTooltip
            renderLink={linkProps => (
              <Button icon="feedback" variant="empty" {...linkProps}>
                Give feedback
              </Button>
            )}
          />
          <CopyLinkButton variant="empty" />
          <Delete 
            issue={issue} 
            issueId={issue.id} 
            fetchProject={fetchProject} 
            modalClose={modalClose}
            onDelete={handleIssueDelete}
          />
          <Button icon="close" iconSize={24} variant="empty" onClick={modalClose} />
        </TopActionsRight>
      </TopActions>

      <Content>
        <Left>
          <Title issue={issue} updateIssue={updateIssue} />
          <Description issue={issue} updateIssue={updateIssue} />
          <Comments issue={issue} fetchIssue={fetchIssue} />
        </Left>

        <Right>
          <Status issue={issue} updateIssue={updateIssue} />
          <AssigneesReporter 
            issue={issue} 
            updateIssue={updateIssue} 
            projectUsers={projectUsers} 
          />
          <Priority issue={issue} updateIssue={updateIssue} />
          <EstimateTracking issue={issue} updateIssue={updateIssue} />
          <Dates issue={issue} />
        </Right>
      </Content>
    </Fragment>
  );
};

ProjectBoardIssueDetails.propTypes = propTypes;
export default ProjectBoardIssueDetails;
