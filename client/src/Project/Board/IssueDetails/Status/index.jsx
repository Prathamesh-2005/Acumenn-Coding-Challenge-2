import React, { Fragment, useState } from 'react';
import PropTypes from 'prop-types';
import { IssueStatus, IssueStatusCopy } from 'shared/constants/issues';
import { Select, Icon } from 'shared/components';
import { SectionTitle } from '../Styles';
import { Status } from './Styles';
// Fix: Import supabase directly
import supabase  from 'config/supaBaseConfig';

const propTypes = {
  issue: PropTypes.object.isRequired,
  updateIssue: PropTypes.func.isRequired,
};

const ProjectBoardIssueDetailsStatus = ({ issue, updateIssue }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  // No need to call useSupabaseClient anymore

  const handleStatusChange = async (status) => {
    setIsUpdating(true);
    
    // Update the status in Supabase
    const { error } = await supabase
      .from('issue')
      .update({ 
        status: status,
        updated_at: new Date()
      })
      .eq('id', issue.id);
    
    if (!error) {
      // Call the parent component's update function to sync UI state
      updateIssue({ status });
    } else {
      console.error('Error updating status:', error);
    }
    
    setIsUpdating(false);
  };

  return (
    <Fragment>
      <SectionTitle>Status</SectionTitle>
      <Select
        variant="empty"
        dropdownWidth={343}
        withClearValue={false}
        name="status"
        value={issue.status}
        isDisabled={isUpdating}
        options={Object.values(IssueStatus).map(status => ({
          value: status,
          label: IssueStatusCopy[status],
        }))}
        onChange={status => handleStatusChange(status)}
        renderValue={({ value: status }) => (
          <Status isValue color={status}>
            <div>{IssueStatusCopy[status]}</div>
            <Icon type="chevron-down" size={18} />
          </Status>
        )}
        renderOption={({ value: status }) => (
          <Status color={status}>{IssueStatusCopy[status]}</Status>
        )}
      />
    </Fragment>
  );
};

ProjectBoardIssueDetailsStatus.propTypes = propTypes;

export default ProjectBoardIssueDetailsStatus;