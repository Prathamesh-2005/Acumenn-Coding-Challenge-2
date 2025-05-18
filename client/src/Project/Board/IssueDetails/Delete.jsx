import React from 'react';
import PropTypes from 'prop-types';
import supabase from 'config/supaBaseConfig';
import toast from 'shared/utils/toast';
import { Button, ConfirmModal } from 'shared/components';

const ProjectBoardIssueDetailsDelete = ({ issueId, fetchProject, modalClose, updateLocalProjectIssues }) => {
  const handleIssueDelete = async () => {
    try {
      // Check if supabase is properly initialized
      if (!supabase || typeof supabase.from !== 'function') {
        throw new Error('Supabase client is not properly initialized');
      }
      
      // Delete the issue from the database
      const { error } = await supabase
        .from('issue')
        .delete()
        .eq('id', issueId);
        
      if (error) throw error;
      
      // Update local state to remove the deleted issue
      // Call updateLocalProjectIssues with a function that filters out the deleted issue
      updateLocalProjectIssues(currentIssues => 
        Array.isArray(currentIssues) 
          ? currentIssues.filter(issue => issue.id !== issueId)
          : []
      );
      
      toast.success('Issue successfully deleted');
      
      // Close the modal after deletion
      modalClose();
      
      // Fetch project to refresh data
      await fetchProject();
      
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
  updateLocalProjectIssues: PropTypes.func.isRequired,
};

export default ProjectBoardIssueDetailsDelete;
