import React from 'react';
import PropTypes from 'prop-types';

import { formatDateTimeConversational } from 'shared/utils/dateTime';

import { Dates } from './Styles';

const propTypes = {
  issue: PropTypes.shape({
    createdAt: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.instanceOf(Date),
    ]).isRequired,
    updatedAt: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.instanceOf(Date),
    ]).isRequired,
  }).isRequired,
};

const ProjectBoardIssueDetailsDates = ({ issue }) => {
  // Convert to Date objects if they are strings
  const createdAtDate =
    typeof issue.createdAt === 'string' ? new Date(issue.createdAt) : issue.createdAt;
  const updatedAtDate =
    typeof issue.updatedAt === 'string' ? new Date(issue.updatedAt) : issue.updatedAt;

  return (
    <Dates>
      <div>Created at {formatDateTimeConversational(createdAtDate)}</div>
      <div>Updated at {formatDateTimeConversational(updatedAtDate)}</div>
    </Dates>
  );
};

ProjectBoardIssueDetailsDates.propTypes = propTypes;

export default ProjectBoardIssueDetailsDates;
