import React from 'react';
import PropTypes from 'prop-types';
import supabase from 'config/supaBaseConfig';
import toast from 'shared/utils/toast';
import { Button, ConfirmModal } from 'shared/components';

const ProjectBoardIssueDetailsDelete = ({ 
  issueId, 
  fetchProject, 
  fetchIssues, 
  updateLocalProjectIssues, 
  modalClose 
}) => {
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
      
      // First, close the modal immediately
      modalClose();
      
      // Show success message
      toast.success('Issue successfully deleted');
      
      // IMPORTANT: This is the key part for real-time updates 
      // Get current issues and filter out the deleted one
      if (typeof updateLocalProjectIssues === 'function') {
        // Filter out the deleted issue directly
        updateLocalProjectIssues(prevIssues => {
          return prevIssues.filter(issue => issue.id !== issueId);
        });
      }
      
      // Refresh project data
      if (typeof fetchProject === 'function') {
        try {
          await fetchProject();
        } catch (err) {
          console.error('Error refreshing project data:', err);
        }
      }
      
      // Force refresh issues from server to sync with database
      if (typeof fetchIssues === 'function') {
        try {
          await fetchIssues(true);
        } catch (err) {
          console.error('Error refreshing issues:', err);
        }
      }
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
  issueId: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number
  ]).isRequired,
  fetchProject: PropTypes.func.isRequired,
  fetchIssues: PropTypes.func.isRequired,
  updateLocalProjectIssues: PropTypes.func.isRequired,
  modalClose: PropTypes.func.isRequired,
};

export default ProjectBoardIssueDetailsDelete;
