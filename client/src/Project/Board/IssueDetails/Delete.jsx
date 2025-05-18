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
      
      // Convert issueId to proper format if needed (some databases require specific types)
      const formattedIssueId = String(issueId);
      
      // Delete the issue from the database
      const { error } = await supabase
        .from('issue')
        .delete()
        .eq('id', formattedIssueId);
        
      if (error) throw error;

      // First close the modal to prevent UI issues
      modalClose();
      
      // Then update local state by removing the deleted issue
      // We're passing a function here, not expecting the result as a callback
      updateLocalProjectIssues(prevIssues => 
        prevIssues.filter(issue => String(issue.id) !== formattedIssueId)
      );
      
      // Show success message
      toast.success('Issue successfully deleted');
      
      // In the background, refresh the project data
      // Use setTimeout to ensure this happens after the UI updates
      setTimeout(() => {
        if (fetchProject) {
          fetchProject().catch(err => console.error('Background project fetch failed:', err));
        }
        
        if (fetchIssues) {
          fetchIssues(true).catch(err => console.error('Background issues fetch failed:', err));
        }
      }, 100);
      
    } catch (err) {
      console.error('Delete issue error:', err);
      toast.error(`Failed to delete issue: ${err.message || 'Unknown error'}`);
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
