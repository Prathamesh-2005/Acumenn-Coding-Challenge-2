import React from 'react';
import PropTypes from 'prop-types';

import supabase from 'config/supaBaseConfig';
import toast from 'shared/utils/toast';
import { Button, ConfirmModal } from 'shared/components';

const ProjectBoardIssueDetailsDelete = ({ issue, issueId, fetchProject, modalClose, updateLocalProjectIssues }) => {
  const handleIssueDelete = async () => {
    try {
      // Check if supabase is properly initialized
      if (!supabase || typeof supabase.from !== 'function') {
        throw new Error('Supabase client is not properly initialized');
      }
      
      // Immediately update local state for optimistic UI update
      // Using a special flag to mark the issue as being deleted
      if (updateLocalProjectIssues) {
        updateLocalProjectIssues(issueId, { isDeleted: true });
      }
      
      // Perform the actual deletion
      const { error } = await supabase
        .from('issue')
        .delete()
        .eq('id', issueId);

      if (error) throw error;

      // Close the modal immediately for better UX
      modalClose();
      
      // Show success message
      toast.success('Issue successfully deleted');
      
      // Refresh project data in the background
      // This ensures all components are synced with the latest data
      fetchProject(true);
      
    } catch (err) {
      console.error('Delete issue error:', err);
      toast.error(`Failed to delete issue: ${err.message}`);
      
      // If there was an error, revert the optimistic update
      if (updateLocalProjectIssues) {
        updateLocalProjectIssues(issueId, { isDeleted: false });
      }
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
  issue: PropTypes.object.isRequired,
  issueId: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number
  ]).isRequired,
  fetchProject: PropTypes.func.isRequired,
  modalClose: PropTypes.func.isRequired,
  updateLocalProjectIssues: PropTypes.func
};

export default ProjectBoardIssueDetailsDelete;
