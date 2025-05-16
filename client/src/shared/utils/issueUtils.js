// shared/utils/issueUtils.js
import supabase from './supabase';

/**
 * Fetches an issue by ID with all its comments and related user information
 * @param {number} issueId - The ID of the issue to fetch
 * @returns {Promise<Object>} - The issue with comments and user data
 */
export const fetchIssueWithComments = async (issueId) => {
  // First, fetch the issue itself
  const { data: issue, error: issueError } = await supabase
    .from('issue')
    .select(`
      *,
      reporter:reporterId(id, name, email, avatarUrl)
    `)
    .eq('id', issueId)
    .single();

  if (issueError) throw issueError;

  // Next, fetch all comments for this issue with their user info
  const { data: comments, error: commentsError } = await supabase
    .from('comment')
    .select(`
      *,
      user:userId(id, name, email, avatarUrl)
    `)
    .eq('issueId', issueId)
    .order('createdAt', { ascending: false });

  if (commentsError) throw commentsError;

  // Fetch the assigned users for this issue
  const { data: assignees, error: assigneesError } = await supabase
    .from('issue_users_user')
    .select(`
      userId,
      user:userId(id, name, email, avatarUrl)
    `)
    .eq('issueId', issueId);

  if (assigneesError) throw assigneesError;

  // Combine all the data into a single issue object
  return {
    ...issue,
    comments,
    assignees: assignees.map(a => a.user)
  };
};

/**
 * Updates an issue's field
 * @param {number} issueId - The ID of the issue to update
 * @param {Object} updateFields - Key-value pairs of fields to update
 * @returns {Promise} - The update result
 */
export const updateIssue = async (issueId, updateFields) => {
  const { error } = await supabase
    .from('issue')
    .update({
      ...updateFields,
      updatedAt: new Date().toISOString()
    })
    .eq('id', issueId);

  if (error) throw error;
};

/**
 * Adds an assignee to an issue
 * @param {number} issueId - The issue ID
 * @param {string} userId - The user UUID to assign
 * @returns {Promise} - The result
 */
export const addIssueAssignee = async (issueId, userId) => {
  const { error } = await supabase
    .from('issue_users_user')
    .insert({ issueId, userId });

  if (error) throw error;
};

/**
 * Removes an assignee from an issue
 * @param {number} issueId - The issue ID
 * @param {string} userId - The user UUID to unassign
 * @returns {Promise} - The result
 */
export const removeIssueAssignee = async (issueId, userId) => {
  const { error } = await supabase
    .from('issue_users_user')
    .delete()
    .eq('issueId', issueId)
    .eq('userId', userId);

  if (error) throw error;
};