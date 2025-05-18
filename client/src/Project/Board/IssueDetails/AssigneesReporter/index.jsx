import React, { Fragment, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Avatar, Select, Icon } from 'shared/components';
import { SectionTitle } from '../Styles';
import { User, Username } from './Styles';
import supabase from 'config/supaBaseConfig';
import toast from 'shared/utils/toast';

const propTypes = {
  issue: PropTypes.object.isRequired,
  updateIssue: PropTypes.func.isRequired,
  projectUsers: PropTypes.array.isRequired,
};

const ProjectBoardIssueDetailsAssigneesReporter = ({ issue, updateIssue, projectUsers }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [userIds, setUserIds] = useState([]);
  
  const getUserById = userId => projectUsers.find(user => user.id === userId);
  const userOptions = projectUsers.map(user => ({ value: user.id, label: user.name }));

  // Extract userIds from issue.users on load and when issue changes
  useEffect(() => {
    if (issue?.users) {
      const extractedUserIds = issue.users.map(user => user.id);
      setUserIds(extractedUserIds);
    }
  }, [issue?.users]);

  // Update assignees in Supabase
  const updateAssignees = async (selectedUserIds) => {
    try {
      setIsUpdating(true);
      
      // First delete existing assignments for this issue
      const { error: deleteError } = await supabase
        .from('issue_users_user')
        .delete()
        .eq('issueId', issue.id);
        
      if (deleteError) throw deleteError;
      
      // Insert new assignments
      if (selectedUserIds.length > 0) {
        // Create assignments with correct field name mapping
        const assignmentData = selectedUserIds.map(userId => ({
          issueId: issue.id,
          user_id: userId // Correct column name from the database schema
        }));
        
        const { error: insertError } = await supabase
          .from('issue_users_user')
          .insert(assignmentData);
          
        if (insertError) throw insertError;
      }
      
      // Update primary assignee (first user in the list or null)
      const { error: updateError } = await supabase
        .from('issue')
        .update({ assigneeId: selectedUserIds.length > 0 ? selectedUserIds[0] : null })
        .eq('id', issue.id);
        
      if (updateError) throw updateError;
      
      // Update local state (userIds)
      setUserIds(selectedUserIds);
      
      // Find the corresponding user objects from projectUsers
      const selectedUsers = selectedUserIds.map(getUserById).filter(Boolean);
      
      // Update local state via the passed-in updateIssue function
      // This triggers UI update immediately without waiting for fetchIssue
      updateIssue({ 
        users: selectedUsers,
        userIds: selectedUserIds,
        assigneeId: selectedUserIds.length > 0 ? selectedUserIds[0] : null,
      });
      
      toast.success('Assignees updated successfully');
      
    } catch (error) {
      console.error('Error updating assignees:', error);
      toast.error(error.message || 'Failed to update assignees');
    } finally {
      setIsUpdating(false);
    }
  };

  // Update reporter in Supabase
  const updateReporter = async (userId) => {
    try {
      setIsUpdating(true);
      
      // Update reporter in database
      const { error } = await supabase
        .from('issue')
        .update({ reporterId: userId })
        .eq('id', issue.id);
      
      if (error) throw error;
      
      // Update local state with the ID only
      updateIssue({ 
        reporterId: userId,
      });
      
      toast.success('Reporter updated successfully');
      
    } catch (error) {
      console.error('Error updating reporter:', error);
      toast.error(error.message || 'Failed to update reporter');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Fragment>
      <SectionTitle>Assignees</SectionTitle>
      <Select
        isMulti
        variant="empty"
        dropdownWidth={343}
        placeholder="Unassigned"
        name="assignees"
        value={userIds} // Use our local state that's always in sync
        options={userOptions}
        isDisabled={isUpdating}
        onChange={selectedUserIds => {
          updateAssignees(selectedUserIds);
        }}
        renderValue={({ value: userId, removeOptionValue }) =>
          renderUser(getUserById(userId), true, removeOptionValue)
        }
        renderOption={({ value: userId }) => renderUser(getUserById(userId), false)}
      />

      <SectionTitle>Reporter</SectionTitle>
      <Select
        variant="empty"
        dropdownWidth={343}
        withClearValue={false}
        name="reporter"
        value={issue.reporterId}
        options={userOptions}
        isDisabled={isUpdating}
        onChange={userId => updateReporter(userId)}
        renderValue={({ value: userId }) => renderUser(getUserById(userId), true)}
        renderOption={({ value: userId }) => renderUser(getUserById(userId))}
      />
    </Fragment>
  );
};

const renderUser = (user, isSelectValue, removeOptionValue) => {
  if (!user) return null;
  
  return (
    <User
      key={user.id}
      isSelectValue={isSelectValue}
      withBottomMargin={!!removeOptionValue}
      onClick={() => removeOptionValue && removeOptionValue()}
    >
      <Avatar avatarUrl={user.avatarUrl} name={user.name} size={24} />
      <Username>{user.name}</Username>
      {removeOptionValue && <Icon type="close" top={1} />}
    </User>
  );
};

ProjectBoardIssueDetailsAssigneesReporter.propTypes = propTypes;

export default ProjectBoardIssueDetailsAssigneesReporter;
