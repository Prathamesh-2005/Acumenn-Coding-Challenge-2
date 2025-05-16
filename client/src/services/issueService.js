import supabase from '../config/supabase';

export const fetchProjectUsers = async (projectId) => {
  const { data, error } = await supabase
    .from('user')
    .select('id, name, email, avatarUrl')
    .eq('projectId', projectId);
  
  if (error) {
    console.error('Error fetching project users:', error);
    throw error;
  }
  
  return data || [];
};

export const fetchFilteredIssues = async (projectId, filters) => {
  const { searchTerm, userIds, myOnly, recent, currentUserId } = filters;
  
  // Start building the query
  let query = supabase
    .from('issue')
    .select(`
      *,
      reporter:reporterId(id, name, avatarUrl),
      assignee:assigneeId(id, name, avatarUrl),
      comments:comment(id, body, createdAt, user:userId(id, name, avatarUrl))
    `)
    .eq('projectId', projectId);

  // Apply search term filter
  if (searchTerm) {
    query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
  }

  // Apply user filter (assignee or in issue_users_user junction table)
  if (userIds && userIds.length > 0) {
    // First get issues where any of the selected users is the assignee
    const assigneeQuery = supabase
      .from('issue')
      .select('id')
      .eq('projectId', projectId)
      .in('assigneeId', userIds);
    
    // Then get issues where any of the selected users is in the junction table
    const junctionQuery = supabase
      .from('issue_users_user')
      .select('issueId')
      .in('userId', userIds);
    
    const [assigneeResult, junctionResult] = await Promise.all([
      assigneeQuery,
      junctionQuery
    ]);
    
    const assigneeIssueIds = assigneeResult.data?.map(issue => issue.id) || [];
    const junctionIssueIds = junctionResult.data?.map(relation => relation.issueId) || [];
    
    // Combine unique IDs from both queries
    const filteredIssueIds = [...new Set([...assigneeIssueIds, ...junctionIssueIds])];
    
    if (filteredIssueIds.length > 0) {
      query = query.in('id', filteredIssueIds);
    } else {
      // If no issues match the user filter, return empty result
      return [];
    }
  }

  // Filter for "Only My Issues"
  if (myOnly && currentUserId) {
    query = query.or(`assigneeId.eq.${currentUserId},reporterId.eq.${currentUserId}`);
  }

  // Order by recently updated if that filter is active
  if (recent) {
    query = query.order('updatedAt', { ascending: false });
  } else {
    // Default ordering by list position
    query = query.order('listPosition', { ascending: true });
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching filtered issues:', error);
    throw error;
  }

  return data || [];
};

// Helper function to get issues assigned to specific user
export const getIssuesForUser = async (userId, projectId = null) => {
  let query = supabase
    .from('issue')
    .select('*')
    .eq('assigneeId', userId);
  
  if (projectId) {
    query = query.eq('projectId', projectId);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching user issues:', error);
    throw error;
  }
  
  return data || [];
};

// Update the filters in a custom hook if needed
export const useIssueFilters = (initialFilters, projectId) => {
  const [filters, setFilters] = useState(initialFilters);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    const loadFilteredIssues = async () => {
      setLoading(true);
      try {
        const data = await fetchFilteredIssues(projectId, filters);
        setIssues(data);
      } catch (error) {
        console.error('Failed to load filtered issues:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadFilteredIssues();
  }, [filters, projectId]);
  
  const mergeFilters = (newFilters) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      ...newFilters
    }));
  };
  
  return { filters, mergeFilters, issues, loading };
};