import React from 'react';
import PropTypes from 'prop-types';

import supabase from 'config/supaBaseConfig'; // Your Supabase client instance

import { IssueType, IssueTypeCopy } from 'shared/constants/issues';
import { IssueTypeIcon, Select } from 'shared/components';

import { TypeButton, Type, TypeLabel } from './Styles';

const propTypes = {
  issue: PropTypes.object.isRequired,
  updateIssue: PropTypes.func, // optional for parent sync
};

const ProjectBoardIssueDetailsType = ({ issue, updateIssue }) => {
  const handleChange = async (type) => {
    if (type === issue.type) return;

    try {
      const { data, error } = await supabase
        .from('issue')
        .update({ type })
        .eq('id', issue.id)
        .select()
        .single();

      if (error) throw error;

      if (updateIssue) {
        updateIssue({ type });
      }
    } catch (err) {
      console.error('Supabase update error:', err.message);
      // Optional: show user notification or error message here
    }
  };

  return (
    <Select
      variant="empty"
      dropdownWidth={150}
      withClearValue={false}
      name="type"
      value={issue.type}
      options={Object.values(IssueType).map((type) => ({
        value: type,
        label: IssueTypeCopy[type],
      }))}
      onChange={({ value }) => handleChange(value)}
      renderValue={({ value: type }) => (
        <TypeButton variant="empty" icon={<IssueTypeIcon type={type} />}>
          {`${IssueTypeCopy[type]}-${issue.id}`}
        </TypeButton>
      )}
      renderOption={({ value: type }) => (
        <Type key={type} onClick={() => handleChange(type)}>
          <IssueTypeIcon type={type} top={1} />
          <TypeLabel>{IssueTypeCopy[type]}</TypeLabel>
        </Type>
      )}
    />
  );
};

ProjectBoardIssueDetailsType.propTypes = propTypes;

export default ProjectBoardIssueDetailsType;
