import React, { useEffect, useState } from 'react';
import { Router, Switch, Route, Redirect } from 'react-router-dom';

import history from 'browserHistory';
import LandingPage from 'pages/LandingPage';
import Project from 'Project';
import Authenticate from 'Auth/Authenticate';
import PageError from 'shared/components/PageError';
import { PageLoader } from 'shared/components';
import authService from 'config/authService';

const Routes = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check initial auth state
    const checkAuth = async () => {
      const user = await authService.getCurrentUser();
      setIsAuthenticated(!!user);
      setIsLoading(false);
    };

    checkAuth();

    // Set up auth state listener
    const { data: authListener } = authService.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, !!session?.user);

      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        setIsAuthenticated(!!session?.user);
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
      }
    });

    // Clean up listener on unmount
    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <Router history={history}>
      <Switch>
        {/* Landing Page */}
        <Route exact path="/" component={LandingPage} />

        {/* Authentication */}
        <Route
          path="/authenticate"
          render={() =>
            isAuthenticated ? <Redirect to="/project" /> : <Authenticate />
          }
        />

        <Route
          path="/login"
          render={() =>
            isAuthenticated ? <Redirect to="/project" /> : <Authenticate />
          }
        />

        {/* Project Handling */}
        <Route
          path="/project"
          render={() =>
            isAuthenticated ? <Project /> : <Redirect to="/authenticate" />
          }
        />

        {/* 404 fallback */}
        <Route component={PageError} />
      </Switch>
    </Router>
  );
};

export default Routes;
