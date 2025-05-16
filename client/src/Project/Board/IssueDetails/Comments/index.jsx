import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { sortByNewest } from 'shared/utils/javascript';
import supabase from 'config/supaBaseConfig';
import Create from './Create';
import Comment from './Comment';
import { Comments, Title } from './Styles';

const propTypes = {
  issue: PropTypes.object.isRequired,
  fetchIssue: PropTypes.func.isRequired,
};

const ProjectBoardIssueDetailsComments = ({ issue, fetchIssue }) => {
  // Subscribe to realtime changes for all comments on this issue
  useEffect(() => {
    const subscription = supabase
      .channel('issue-comments')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'comment',
        filter: `issueId=eq.${issue.id}`
      }, (payload) => {
        console.log('Comment change detected:', payload);
        fetchIssue();
      })
      .subscribe();
    
    // Debug logging
    console.log(`Subscribed to comments for issue ID: ${issue.id}`);
    
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [issue.id, fetchIssue]);

  // Safely handle potentially undefined comments array
  const comments = issue.comments || [];
  
  // Debug logging
  console.log('Current comments:', comments);
  const fetchComments = async () => {
  const { data, error } = await supabase
    .from('comment')
    .select('*')
    .eq('issueId', issue.id)
    .order('createdAt', { ascending: true });

  if (error) {
    console.error('Error fetching comments:', error.message);
    return;
  }

  fetchIssue(); // To ensure the issue object (with comments) gets updated
};


  return (
    <Comments>
      <Title>Comments</Title>
      <Create issueId={issue.id} fetchIssue={fetchIssue} />
      {comments.length > 0 ? 
        sortByNewest(comments, 'createdAt').map(comment => (
          <Comment key={comment.id} comment={comment} fetchIssue={fetchIssue}  fetchComments={fetchComments}  />
          
        )) : 
        <p style={{ color: '#8993a4', margin: '10px 0', fontSize: '14px' }}>
          No comments yet. Be the first to comment!
        </p>
      }
    </Comments>
  );
};

ProjectBoardIssueDetailsComments.propTypes = propTypes;

export default ProjectBoardIssueDetailsComments;