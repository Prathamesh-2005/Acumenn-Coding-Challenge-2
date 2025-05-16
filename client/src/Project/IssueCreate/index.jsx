import React, { useState } from 'react';
import PropTypes from 'prop-types';

import {
  IssueType,
  IssueStatus,
  IssuePriority,
  IssueTypeCopy,
  IssuePriorityCopy,
} from 'shared/constants/issues';
import toast from 'shared/utils/toast';
import useCurrentUser from 'shared/hooks/currentUser';
import { Form, IssueTypeIcon, Icon, Avatar, IssuePriorityIcon } from 'shared/components';
import  supabase  from 'config/supaBaseConfig';

import {
  FormHeading,
  FormElement,
  SelectItem,
  SelectItemLabel,
  Divider,
  Actions,
  ActionButton,
} from './Styles';

const propTypes = {
  project: PropTypes.object.isRequired,
  fetchProject: PropTypes.func.isRequired,
  fetchIssues: PropTypes.func.isRequired,
  updateLocalProjectIssues: PropTypes.func.isRequired,
  modalClose: PropTypes.func.isRequired,
  onCreate: PropTypes.func,
};

const defaultProps = {
  onCreate: () => {},
};

const IssueCreate = ({ 
  project, 
  fetchProject, 
  fetchIssues,
  updateLocalProjectIssues, 
  modalClose, 
  onCreate 
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { currentUserId } = useCurrentUser();

  // To prevent duplicate submissions
  const isSubmitting = isCreating || submitting;

  return (
    <Form
      enableReinitialize
      initialValues={{
        type: IssueType.TASK,
        title: '',
        description: '',
        reporterId: currentUserId,
        userIds: [],
        assigneeId: null,
        priority: IssuePriority.MEDIUM,
      }}
      validations={{
        type: Form.is.required(),
        title: [Form.is.required(), Form.is.maxLength(200)],
        reporterId: Form.is.required(),
        priority: Form.is.required(),
      }}
      onSubmit={async (values, form) => {
        try {
          setSubmitting(true);
          setIsCreating(true);

          // Set first user as assignee if assigneeId is not specified but users are selected
          const assigneeId = values.assigneeId || (values.userIds.length > 0 ? values.userIds[0] : null);
          
          // Prepare the issue data for database insertion
          const issueData = {
            title: values.title,
            description: values.description,
            descriptionText: values.description ? String(values.description).replace(/<[^>]*>/g, '') : '',
            type: values.type,
            status: IssueStatus.BACKLOG,
            priority: values.priority,
            listPosition: 0, // Will be positioned at the top of backlog
            reporterId: values.reporterId,
            assigneeId: assigneeId,
            projectId: project.id,
            estimate: null,
            timeSpent: null,
            timeRemaining: null
          };
          
          // Insert issue into Supabase
          const { data: createdIssue, error } = await supabase
            .from('issue')
            .insert(issueData)
            .select('*')
            .single();
            
          if (error) {
            throw new Error(error.message);
          }

          // Insert user assignments into junction table
          if (values.userIds && values.userIds.length > 0) {
            const userAssignments = values.userIds.map(userId => ({
              issueId: createdIssue.id,
              userId: userId
            }));
            
            const { error: assignmentError } = await supabase
              .from('issue_users_user')
              .insert(userAssignments);
              
            if (assignmentError) {
              console.error('Error assigning users:', assignmentError);
              toast.warning('Issue created but there was a problem assigning some users.');
            }
          }
          
          // Format the created issue to match the expected shape in the UI
          if (createdIssue) {
            const formattedIssue = {
              ...createdIssue,
              userIds: values.userIds,
              users: values.userIds.map(userId => {
                const user = project.users.find(u => u.id === userId);
                return user || null;
              }).filter(Boolean),
              reporter: project.users.find(user => user.id === values.reporterId),
              assignee: assigneeId ? project.users.find(user => user.id === assigneeId) : null,
            };
            
            // Update local project issues
            updateLocalProjectIssues(currentIssues => {
              // Add the new issue at the beginning of the array for immediate visibility
              return [formattedIssue, ...currentIssues];
            });
          }
          
          // Fetch updated project data
          await fetchProject();
          
          // Refresh the issues list to get server-updated positions and any other backend changes
          await fetchIssues(true);
          
          toast.success('Issue has been successfully created.');
          
          // Trigger the onCreate callback
          if (onCreate) {
            onCreate(createdIssue);
          }
          
          // Close the modal
          modalClose();
        } catch (error) {
          console.error('Failed to create issue:', error);
          Form.handleAPIError(error, form);
          toast.error(`Failed to create issue: ${error.message}`);
        } finally {
          setSubmitting(false);
          setIsCreating(false);
        }
      }}
    >
      <FormElement>
        <FormHeading>Create Issue</FormHeading>
        <Form.Field.Select
          name="type"
          label="Issue Type"
          tip="Start typing to get a list of possible matches."
          options={typeOptions}
          renderOption={renderType}
          renderValue={renderType}
        />
        <Divider />
        <Form.Field.Input
          name="title"
          label="Short Summary"
          tip="Concisely summarize the issue in one or two sentences."
          placeholder="Enter issue title"
        />
        <Form.Field.TextEditor
          name="description"
          label="Description"
          tip="Describe the issue in as much detail as you'd like."
          placeholder="Provide a detailed description of the issue"
        />
        <Form.Field.Select
          name="reporterId"
          label="Reporter"
          options={userOptions(project)}
          renderOption={renderUser(project)}
          renderValue={renderUser(project)}
        />
        <Form.Field.Select
          name="assigneeId"
          label="Assignee"
          tip="Person who is primarily responsible for this issue."
          options={userOptions(project)}
          renderOption={renderUser(project)}
          renderValue={renderUser(project)}
        />
        <Form.Field.Select
          isMulti
          name="userIds"
          label="Additional Users"
          tip="People who are involved with this issue."
          options={userOptions(project)}
          renderOption={renderUser(project)}
          renderValue={renderUser(project)}
        />
        <Form.Field.Select
          name="priority"
          label="Priority"
          tip="Priority in relation to other issues."
          options={priorityOptions}
          renderOption={renderPriority}
          renderValue={renderPriority}
        />
        <Actions>
          <ActionButton type="submit" variant="primary" isWorking={isSubmitting} disabled={isSubmitting}>
            Create Issue
          </ActionButton>
          <ActionButton type="button" variant="empty" onClick={modalClose} disabled={isSubmitting}>
            Cancel
          </ActionButton>
        </Actions>
      </FormElement>
    </Form>
  );
};

const typeOptions = Object.values(IssueType).map(type => ({
  value: type,
  label: IssueTypeCopy[type],
}));

const priorityOptions = Object.values(IssuePriority).map(priority => ({
  value: priority,
  label: IssuePriorityCopy[priority],
}));

const userOptions = project => project.users.map(user => ({ value: user.id, label: user.name }));

const renderType = ({ value: type }) => (
  <SelectItem>
    <IssueTypeIcon type={type} top={1} />
    <SelectItemLabel>{IssueTypeCopy[type]}</SelectItemLabel>
  </SelectItem>
);

const renderPriority = ({ value: priority }) => (
  <SelectItem>
    <IssuePriorityIcon priority={priority} top={1} />
    <SelectItemLabel>{IssuePriorityCopy[priority]}</SelectItemLabel>
  </SelectItem>
);

const renderUser = project => ({ value: userId, removeOptionValue }) => {
  const user = project.users.find(({ id }) => id === userId);
  
  if (!user) return null;

  return (
    <SelectItem
      key={user.id}
      withBottomMargin={!!removeOptionValue}
      onClick={() => removeOptionValue && removeOptionValue()}
    >
      <Avatar size={20} avatarUrl={user.avatarUrl} name={user.name} />
      <SelectItemLabel>{user.name}</SelectItemLabel>
      {removeOptionValue && <Icon type="close" top={2} />}
    </SelectItem>
  );
};

IssueCreate.propTypes = propTypes;
IssueCreate.defaultProps = defaultProps;

export default IssueCreate;