import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || "https://qublxlqfwshijqyoypvj.supabase.co"
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY  || "NoaWpxeW95cHZqIiwicm9sZSeyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1Ymx4bHFmd3I6ImFub24iLCJpYXQiOjE3NDcwMzQwMzksImV4cCI6MjA2MjYxMDAzOX0.hj1IF69O72Q4FD49ZO6NvanG4N57Fiiqes2VAqaX8cc"

// Create and export the Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const getProject = async (projectId) => {
  const { data, error } = await supabase
    .from('project')
    .select('*, users:user(*)')
    .eq('id', projectId)
    .single();
    
  if (error) throw error;
  return data;
};

export const getIssues = async (projectId) => {
  const { data, error } = await supabase
    .from('issue')
    .select(`
      *,
      reporter:reporterId(id, name, avatarUrl),
      assignee:assigneeId(id, name, avatarUrl),
      users:issue_users_user(userId(id, name, avatarUrl))
    `)
    .eq('projectId', projectId)
    .order('listPosition', { ascending: true });
    
  if (error) throw error;
  
  // Format the issues to match the application's expected structure
  return data.map(issue => ({
    ...issue,
    userIds: issue.users ? issue.users.map(u => u.userId.id) : [],
    users: issue.users ? issue.users.map(u => u.userId) : []
  }));
};

export const updateIssue = async (issueId, updateData) => {
  const { data, error } = await supabase
    .from('issue')
    .update(updateData)
    .eq('id', issueId)
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

export const updateIssuePosition = async (issueId, listPosition, status) => {
  const { data, error } = await supabase
    .from('issue')
    .update({ 
      listPosition,
      status,
      updatedAt: new Date().toISOString()
    })
    .eq('id', issueId)
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

export default supabase;