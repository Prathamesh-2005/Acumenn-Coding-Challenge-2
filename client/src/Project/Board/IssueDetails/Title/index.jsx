import React, { Fragment, useRef, useState } from 'react';
import PropTypes from 'prop-types';

import supabase from 'config/supaBaseConfig';
import { KeyCodes } from 'shared/constants/keyCodes';
import { is, generateErrors } from 'shared/utils/validation';

import { TitleTextarea, ErrorText } from './Styles';

const ProjectBoardIssueDetailsTitle = ({ issue, updateIssue }) => {
  const $titleInputRef = useRef();
  const [error, setError] = useState(null);

  const handleTitleChange = async () => {
    setError(null);

    const title = $titleInputRef.current.value.trim();
    if (title === issue.title) return;

    const errors = generateErrors(
      { title },
      { title: [is.required(), is.maxLength(200)] }
    );

    if (errors.title) {
      setError(errors.title);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('issue')
        .update({ title })
        .eq('id', issue.id)
        .select()
        .single();

      if (error) throw error;

      if (updateIssue) {
        updateIssue({ title });
      }
    } catch (err) {
      setError('Failed to update title. Please try again.');
      console.error('Supabase update error:', err.message);
    }
  };

  return (
    <Fragment>
      <TitleTextarea
        ref={$titleInputRef}
        defaultValue={issue.title}
        onBlur={handleTitleChange}
        onKeyDown={event => {
          if (event.keyCode === KeyCodes.ENTER) {
            event.preventDefault(); // prevent new line
            event.target.blur();
          }
        }}
      />
      {error && <ErrorText>{error}</ErrorText>}
    </Fragment>
  );
};

ProjectBoardIssueDetailsTitle.propTypes = {
  issue: PropTypes.object.isRequired,
  updateIssue: PropTypes.func.isRequired,
};

export default ProjectBoardIssueDetailsTitle;