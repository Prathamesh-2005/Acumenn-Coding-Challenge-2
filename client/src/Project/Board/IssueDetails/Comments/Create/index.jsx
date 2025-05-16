import React, { Fragment, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import supabase from 'config/supaBaseConfig';
import useCurrentUser from 'shared/hooks/currentUser';
import toast from 'shared/utils/toast';
import BodyForm from '../BodyForm';
import ProTip from './ProTip';
import { Create, UserAvatar, Right, FakeTextarea } from './Styles';

const propTypes = {
  issueId: PropTypes.number.isRequired,
  fetchIssue: PropTypes.func.isRequired,
};

const ProjectBoardIssueDetailsCommentsCreate = ({ issueId, fetchIssue }) => {
  const [isFormOpen, setFormOpen] = useState(false);
  const [isCreating, setCreating] = useState(false);
  const [body, setBody] = useState('');
  const { currentUser } = useCurrentUser();

  // Subscribe to realtime changes for comments
  useEffect(() => {
    const subscription = supabase
      .channel('comments')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'comment',
        filter: `issueId=eq.${issueId}`
      }, () => {
        fetchIssue();
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [issueId, fetchIssue]);

  const handleCommentCreate = async () => {
    if (!body.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }
    
    try {
      setCreating(true);
      
      // Fixed bug: using the correct field name issueId instead of issue_id
      const { error } = await supabase
        .from('comment')
        .insert({
          body,
          issueId: issueId, // Fixed: using the correct prop name
          userId: currentUser.id,
          createdAt: new Date().toISOString()
        });
      
      if (error) throw error;
      
      setFormOpen(false);
      setCreating(false);
      setBody('');
      toast.success("Comment added successfully");
      fetchIssue(); // Explicitly fetch issue to refresh comments
    } catch (error) {
      console.error("Comment creation error:", error);
      toast.error(error.message || "Failed to create comment");
      setCreating(false);
    }
  };

  return (
    <Create>
      {currentUser && <UserAvatar name={currentUser.name} avatarUrl={currentUser.avatarUrl} />}
      <Right>
        {isFormOpen ? (
          <BodyForm
            value={body}
            onChange={setBody}
            isWorking={isCreating}
            onSubmit={handleCommentCreate}
            onCancel={() => setFormOpen(false)}
          />
        ) : (
          <Fragment>
            <FakeTextarea onClick={() => setFormOpen(true)}>Add a comment...</FakeTextarea>
            <ProTip setFormOpen={setFormOpen} />
          </Fragment>
        )}
      </Right>
    </Create>
  );
};

ProjectBoardIssueDetailsCommentsCreate.propTypes = propTypes;

export default ProjectBoardIssueDetailsCommentsCreate;