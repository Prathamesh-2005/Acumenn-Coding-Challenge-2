import React, { Fragment, useState } from 'react';
import PropTypes from 'prop-types';
import { IssuePriority, IssuePriorityCopy } from 'shared/constants/issues';
import { Select, IssuePriorityIcon } from 'shared/components';
import { SectionTitle } from '../Styles';
import { Priority, Label } from './Styles';
// Fix: Import supabase directly
import supabase  from 'config/supaBaseConfig';

const propTypes = {
  issue: PropTypes.object.isRequired,
  updateIssue: PropTypes.func.isRequired,
};

const ProjectBoardIssueDetailsPriority = ({ issue, updateIssue }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  // No need to call useSupabaseClient anymore

  const handlePriorityChange = async (priority) => {
    setIsUpdating(true);
    
    // Update the priority in Supabase
    const { error } = await supabase
      .from('issue')
      .update({ 
        priority: priority,
        updated_at: new Date()
      })
      .eq('id', issue.id);
    
    if (!error) {
      // Call the parent component's update function to sync UI state
      updateIssue({ priority });
    } else {
      console.error('Error updating priority:', error);
    }
    
    setIsUpdating(false);
  };

  return (
    <Fragment>
      <SectionTitle>Priority</SectionTitle>
      <Select
        variant="empty"
        withClearValue={false}
        dropdownWidth={343}
        name="priority"
        value={issue.priority}
        isDisabled={isUpdating}
        options={Object.values(IssuePriority).map(priority => ({
          value: priority,
          label: IssuePriorityCopy[priority],
        }))}
        onChange={priority => handlePriorityChange(priority)}
        renderValue={({ value: priority }) => renderPriorityItem(priority, true)}
        renderOption={({ value: priority }) => renderPriorityItem(priority)}
      />
    </Fragment>
  );
};

const renderPriorityItem = (priority, isValue) => (
  <Priority isValue={isValue}>
    <IssuePriorityIcon priority={priority} />
    <Label>{IssuePriorityCopy[priority]}</Label>
  </Priority>
);

ProjectBoardIssueDetailsPriority.propTypes = propTypes;

export default ProjectBoardIssueDetailsPriority;