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
      
      // Show success message
      toast.success('Issue successfully deleted');
      
      // Immediately update local state by filtering out the deleted issue
      // This provides instant UI feedback without waiting for server refresh
      if (typeof updateLocalProjectIssues === 'function') {
        // Assuming the updateLocalProjectIssues function expects an array of issues
        // We're telling it to filter out the issue that was just deleted
        updateLocalProjectIssues(currentIssues => 
          currentIssues.filter(issue => issue.id !== issueId)
        );
      }
      
      // Close the modal so user can continue with their workflow
      modalClose();
      
      // Refresh project data if needed (e.g., for issue counts)
      if (typeof fetchProject === 'function') {
        await fetchProject().catch(err => {
          console.error('Error refreshing project data:', err);
        });
      }
      
      // Force refresh issues list from server to ensure everything is in sync
      if (typeof fetchIssues === 'function') {
        await fetchIssues(true).catch(err => {
          console.error('Error refreshing issues:', err);
        });
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
  // Accept both string and number types for issueId
  issueId: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number
  ]).isRequired,
  fetchProject: PropTypes.func.isRequired,
  fetchIssues: PropTypes.func.isRequired, 
  updateLocalProjectIssues: PropTypes.func, // For instant UI updates
  modalClose: PropTypes.func.isRequired,
};

export default ProjectBoardIssueDetailsDelete;
