import React from 'react';
import PropTypes from 'prop-types';
import { Button, ConfirmModal } from 'shared/components';

const ProjectBoardIssueDetailsDelete = ({ issue, issueId, onDelete }) => {
  return (
    <ConfirmModal
      title="Are you sure you want to delete this issue?"
      message="Once you delete, it's gone for good."
      confirmText="Delete issue"
      onConfirm={onDelete} // Use the handler from the parent
      renderLink={modal => (
        <Button icon="trash" iconSize={19} variant="empty" onClick={modal.open} />
      )}
    />
  );
};

ProjectBoardIssueDetailsDelete.propTypes = {
  issue: PropTypes.object.isRequired,
  issueId: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number
  ]).isRequired,
  onDelete: PropTypes.func.isRequired
};

export default ProjectBoardIssueDetailsDelete;
