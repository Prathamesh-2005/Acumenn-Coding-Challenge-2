import React, { Fragment, useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { get } from 'lodash';
import { sortByNewest } from 'shared/utils/javascript';
import { IssueTypeIcon } from 'shared/components';
import NoResultsSVG from './NoResultsSvg';
import supabase from 'config/supaBaseConfig';
import {
  IssueSearch,
  SearchInputCont,
  SearchInputDebounced,
  SearchIcon,
  SearchSpinner,
  Issue,
  IssueData,
  IssueTitle,
  IssueTypeId,
  SectionTitle,
  NoResults,
  NoResultsTitle,
  NoResultsTip,
} from './Styles';

const propTypes = {
  project: PropTypes.object.isRequired,
};

const ProjectIssueSearch = ({ project }) => {
  const [isSearchTermEmpty, setIsSearchTermEmpty] = useState(true);
  const [matchingIssues, setMatchingIssues] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recentIssues, setRecentIssues] = useState([]);
  
  // Fetch recent issues when component mounts
  useEffect(() => {
    const fetchRecentIssues = async () => {
      try {
        // Convert project ID to number if it's a string
        const projectId = typeof project.id === 'string' 
          ? parseInt(project.id, 10) 
          : project.id;
        
        const { data, error } = await supabase
          .from('issue')
          .select('*')
          .eq('projectId', projectId)
          .order('createdAt', { ascending: false })
          .limit(10);
        
        if (error) {
          console.error('Error fetching recent issues:', error);
          return;
        }
        
        // Format issues with string IDs to match existing code
        const formattedIssues = (data || []).map(issue => ({
          ...issue,
          id: String(issue.id),
          projectId: String(issue.projectId)
        }));
        
        setRecentIssues(formattedIssues);
      } catch (err) {
        console.error('Failed to fetch recent issues:', err);
      }
    };
    
    if (project && project.id) {
      fetchRecentIssues();
    }
  }, [project]);
  
  // Search issues with debounce
  const searchIssues = useCallback(async (searchTerm) => {
    try {
      setIsLoading(true);
      
      // Convert project ID to number if it's a string
      const projectId = typeof project.id === 'string' 
        ? parseInt(project.id, 10) 
        : project.id;
      
      // Use Supabase textSearch or ilike for searching
      const { data, error } = await supabase
        .from('issue')
        .select('*')
        .eq('projectId', projectId)
        .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,descriptionText.ilike.%${searchTerm}%`);
      
      if (error) {
        console.error('Error searching issues:', error);
        setMatchingIssues([]);
        return;
      }
      
      // Format issues with string IDs to match existing code
      const formattedIssues = (data || []).map(issue => ({
        ...issue,
        id: String(issue.id),
        projectId: String(issue.projectId)
      }));
      
      setMatchingIssues(formattedIssues);
    } catch (err) {
      console.error('Failed to search issues:', err);
      setMatchingIssues([]);
    } finally {
      setIsLoading(false);
    }
  }, [project]);
  
  const handleSearchChange = value => {
    const searchTerm = value.trim();
    setIsSearchTermEmpty(!searchTerm);
    
    if (searchTerm) {
      searchIssues(searchTerm);
    } else {
      setMatchingIssues([]);
    }
  };
  
  return (
    <IssueSearch>
      <SearchInputCont>
        <SearchInputDebounced
          autoFocus
          placeholder="Search issues by summary, description..."
          onChange={handleSearchChange}
          delay={500} // Add debounce delay to prevent excessive API calls
        />
        <SearchIcon type="search" size={22} />
        {isLoading && <SearchSpinner />}
      </SearchInputCont>
      
      {isSearchTermEmpty && recentIssues.length > 0 && (
        <Fragment>
          <SectionTitle>Recent Issues</SectionTitle>
          {recentIssues.map(renderIssue)}
        </Fragment>
      )}
      
      {!isSearchTermEmpty && matchingIssues.length > 0 && (
        <Fragment>
          <SectionTitle>Matching Issues</SectionTitle>
          {matchingIssues.map(renderIssue)}
        </Fragment>
      )}
      
      {!isSearchTermEmpty && !isLoading && matchingIssues.length === 0 && (
        <NoResults>
          <NoResultsSVG />
          <NoResultsTitle>We couldn&apos;t find anything matching your search</NoResultsTitle>
          <NoResultsTip>Try again with a different term.</NoResultsTip>
        </NoResults>
      )}
    </IssueSearch>
  );
};

const renderIssue = issue => (
  <Link key={issue.id} to={`/project/board/issues/${issue.id}`}>
    <Issue>
      <IssueTypeIcon type={issue.type} size={25} />
      <IssueData>
        <IssueTitle>{issue.title}</IssueTitle>
        <IssueTypeId>{`${issue.type}-${issue.id}`}</IssueTypeId>
      </IssueData>
    </Issue>
  </Link>
);

ProjectIssueSearch.propTypes = propTypes;

export default ProjectIssueSearch;