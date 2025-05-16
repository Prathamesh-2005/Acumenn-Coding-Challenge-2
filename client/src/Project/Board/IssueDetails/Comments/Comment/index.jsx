import React, { Fragment, useState } from 'react';
import PropTypes from 'prop-types';
import supabase from 'config/supaBaseConfig';
import toast from 'shared/utils/toast';
import { formatDateTimeConversational } from 'shared/utils/dateTime';
import { ConfirmModal } from 'shared/components';
import BodyForm from '../BodyForm';
import {
  Comment,
  UserAvatar,
  Content,
  Username,
  CreatedAt,
  Body,
  EditLink,
  DeleteLink,
} from './Styles';

const propTypes = {
  comment: PropTypes.object.isRequired,
  fetchIssue: PropTypes.func.isRequired,
  fetchComments: PropTypes.func.isRequired,
};

const ProjectBoardIssueDetailsComment = ({ comment, fetchIssue, fetchComments }) => {
  const [isFormOpen, setFormOpen] = useState(false);
  const [isUpdating, setUpdating] = useState(false);
  const [body, setBody] = useState(comment.body);

  // Handle potential structure differences in the data
  const user = comment.user || comment.users || {};
  const userName = user.name || 'Unknown User';
  const userAvatar = user.avatarUrl || user.avatar_url;
  const commentCreatedAt = comment.createdAt || comment.created_at;

  const handleCommentDelete = async () => {
    try {
      const { error } = await supabase
        .from('comment')
        .delete()
        .eq('id', comment.id);
      
      if (error) throw error;
      
      toast.success('Comment deleted successfully');
      fetchComments(); // Directly refresh comments instead of the entire issue
    } catch (error) {
      toast.error(error.message || "Failed to delete comment");
    }
  };

  const handleCommentUpdate = async () => {
    try {
      setUpdating(true);
      
      const { error } = await supabase
        .from('comment')
        .update({ 
          body,
          updatedAt: new Date().toISOString() 
        })
        .eq('id', comment.id);
      
      if (error) throw error;
      
      setUpdating(false);
      setFormOpen(false);
      toast.success('Comment updated successfully');
      fetchComments(); // Directly refresh comments instead of the entire issue
    } catch (error) {
      toast.error(error.message || "Failed to update comment");
      setUpdating(false);
    }
  };

  return (
    <Comment data-testid="issue-comment">
      <UserAvatar name={userName} avatarUrl={userAvatar} />
      <Content>
        <Username>{userName}</Username>
        <CreatedAt>{formatDateTimeConversational(commentCreatedAt)}</CreatedAt>
        {isFormOpen ? (
          <BodyForm
            value={body}
            onChange={setBody}
            isWorking={isUpdating}
            onSubmit={handleCommentUpdate}
            onCancel={() => setFormOpen(false)}
          />
        ) : (
          <Fragment>
            <Body>{comment.body}</Body>
            <EditLink onClick={() => setFormOpen(true)}>Edit</EditLink>
            <ConfirmModal
              title="Are you sure you want to delete this comment?"
              message="Once you delete, it's gone for good."
              confirmText="Delete comment"
              onConfirm={handleCommentDelete}
              renderLink={modal => <DeleteLink onClick={modal.open}>Delete</DeleteLink>}
            />
          </Fragment>
        )}
      </Content>
    </Comment>
  );
};

ProjectBoardIssueDetailsComment.propTypes = propTypes;

export default ProjectBoardIssueDetailsComment;

