import React from 'react';
import PropTypes from 'prop-types';

import supabase from 'config/supaBaseConfig';
import toast from 'shared/utils/toast';
import { Button, ConfirmModal } from 'shared/components';

const ProjectBoardIssueDetailsDelete = ({ issueId, fetchProject, fetchIssues, updateLocalProjectIssues, modalClose }) => {
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

      // Update local state by removing the deleted issue
      updateLocalProjectIssues(prevIssues => 
        prevIssues.filter(issue => issue.id !== issueId)
      );

      // Fetch the updated project data to keep everything in sync
      await fetchProject();
      
      // Close the modal
      modalClose();
      
      // Show success message
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
  fetchIssues: PropTypes.func, // Optional but recommended for immediate refresh
  updateLocalProjectIssues: PropTypes.func.isRequired, // Required for real-time UI updates
  modalClose: PropTypes.func.isRequired,
};

export default ProjectBoardIssueDetailsDelete;
