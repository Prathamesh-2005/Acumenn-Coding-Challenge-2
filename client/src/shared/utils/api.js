import supabase from 'config/supaBaseConfig';
import history from 'browserHistory';
import toast from 'shared/utils/toast';
import { getStoredAuthToken, removeStoredAuthToken } from 'shared/utils/authToken';

const defaults = {
  error: {
    code: 'INTERNAL_ERROR',
    message: 'Something went wrong. Please check your internet connection or contact support.',
    status: 503,
    data: {},
  },
};

const handleError = (error) => {
  if (error?.status === 401) {
    removeStoredAuthToken();
    history.push('/authenticate');
  } else {
    toast.error(error.message || 'Something went wrong!');
  }
};

const handleSuccess = (data) => data;

const normalizeTable = (table) => table.replace(/^\//, '');

const api = {
  get: async (table, filters = {}) => {
    const normalizedTable = normalizeTable(table);
    const query = supabase.from(normalizedTable).select('*');

    Object.entries(filters).forEach(([key, value]) => {
      query.eq(key, value);
    });

    const { data, error } = await query;

    if (error) {
      handleError(error);
      throw error;
    }

    return handleSuccess(data);
  },

  getOne: async (table, filters = {}) => {
    const normalizedTable = normalizeTable(table);
    const query = supabase.from(normalizedTable).select('*');

    Object.entries(filters).forEach(([key, value]) => {
      query.eq(key, value);
    });

    const { data, error } = await query.single();

    if (error) {
      handleError(error);
      throw error;
    }

    return handleSuccess(data);
  },

  projectWithDetails: async (projectId) => {
    const { data, error } = await supabase
      .from('project')
      .select(`
        *,
        issue(*),
        project_user:user_id(*)
      `)
      .eq('id', projectId)
      .single();

    if (error) {
      handleError(error);
      throw error;
    }

    const transformed = {
      ...data,
      issues: data.issue,
      users: data.project_user,
    };

    return handleSuccess(transformed);
  },

  post: async (table, data) => {
    const normalizedTable = normalizeTable(table);
    const { data: responseData, error } = await supabase
      .from(normalizedTable)
      .insert([data])
      .select();

    if (error) {
      handleError(error);
      throw error;
    }
    return handleSuccess(responseData);
  },

  put: async (table, id, updatedFields) => {
    const normalizedTable = normalizeTable(table);
    const { data, error } = await supabase
      .from(normalizedTable)
      .update(updatedFields)
      .eq('id', id)
      .select();

    if (error) {
      handleError(error);
      throw error;
    }

    return handleSuccess(data);
  },

  patch: async (table, id, updatedFields) => {
    const normalizedTable = normalizeTable(table);
    const { data, error } = await supabase
      .from(normalizedTable)
      .update(updatedFields)
      .eq('id', id)
      .select();

    if (error) {
      handleError(error);
      throw error;
    }

    return handleSuccess(data);
  },

  delete: async (table, id) => {
    const normalizedTable = normalizeTable(table);
    const { data, error } = await supabase
      .from(normalizedTable)
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      handleError(error);
      throw error;
    }

    return handleSuccess(data);
  },

  optimisticUpdate: async (table, { updatedFields, currentFields, setLocalData, id }) => {
    const normalizedTable = normalizeTable(table);
    try {
      setLocalData(updatedFields);
      await api.put(normalizedTable, id, updatedFields);
    } catch (error) {
      setLocalData(currentFields);
      toast.error(error.message || 'Optimistic update failed!');
    }
  },
};

export default api;
