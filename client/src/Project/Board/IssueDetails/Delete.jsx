import React from 'react';
import PropTypes from 'prop-types';

import supabase from 'config/supaBaseConfig';
import toast from 'shared/utils/toast';
import { Button, ConfirmModal } from 'shared/components';

const ProjectBoardIssueDetailsDelete = ({ 
  issueId, 
  fetchProject, 
  modalClose, 
  updateLocalProjectIssues, // Add this prop to handle local state updates
  issues // Add this prop to access current issues 
}) => {
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

      // Update the local state immediately to remove the deleted issue
      const updatedIssues = issues.filter(issue => issue.id !== issueId);
      updateLocalProjectIssues(updatedIssues);
      
      // Also fetch the project to ensure server-side consistency
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
  updateLocalProjectIssues: PropTypes.func.isRequired, // Required to update local state
  issues: PropTypes.array.isRequired, // Required to filter current issues
};

export default ProjectBoardIssueDetailsDelete;
