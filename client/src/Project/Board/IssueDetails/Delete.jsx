import React from 'react';
import PropTypes from 'prop-types';

import supabase from 'config/supaBaseConfig';
import toast from 'shared/utils/toast';
import { Button, ConfirmModal } from 'shared/components';

const ProjectBoardIssueDetailsDelete = ({ issueId, fetchProject, modalClose }) => {
  const handleIssueDelete = async () => {
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

      await fetchProject();
      modalClose();
      toast.success('Issue successfully deleted');
    } catch (err) {
      console.error('Delete issue error:', err);
      toast.error(`Failed to delete issue: ${err.message}`);
    }
  };

  return (
    <ConfirmModal
      title="Are you sure you want to delete this issue?"
      message="Once you delete, it's gone for good."
      confirmText="Delete issue"
      onConfirm={handleIssueDelete}
      renderLink={modal => (
        <Button icon="trash" iconSize={19} variant="empty" onClick={modal.open} />
      )}
    />
  );
};

ProjectBoardIssueDetailsDelete.propTypes = {
  // Accept both string and number types for issueId
  issueId: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number
  ]).isRequired,
  fetchProject: PropTypes.func.isRequired,
  modalClose: PropTypes.func.isRequired,
};

export default ProjectBoardIssueDetailsDelete;