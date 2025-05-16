import React, { Fragment, useState } from 'react';
import PropTypes from 'prop-types';

import { getTextContentsFromHtmlString } from 'shared/utils/browser';
import { TextEditor, TextEditedContent, Button } from 'shared/components';

import { Title, EmptyLabel, Actions } from './Styles';
import supabase from 'config/supaBaseConfig';

const propTypes = {
  issue: PropTypes.object.isRequired, // { id, description, ... }
};

const Description = ({ issue }) => {
  const [description, setDescription] = useState(issue.description);
  const [isEditing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    setLoading(true);
    setEditing(false);

    const plainText = getTextContentsFromHtmlString(description).trim();

    const { error } = await supabase
      .from('issue')
      .update({
        description: description,
        descriptionText: plainText,
        updated_at: new Date().toISOString(),
      })
      .eq('id', issue.id);

    if (error) {
      console.error('Error updating description:', error.message);
      // You may show a toast/snackbar here for UX
    }

    setLoading(false);
  };

  const isDescriptionEmpty =
    getTextContentsFromHtmlString(description).trim().length === 0;

  return (
    <Fragment>
      <Title>Description</Title>
      {isEditing ? (
        <Fragment>
          <TextEditor
            placeholder="Describe the issue"
            defaultValue={description}
            onChange={setDescription}
          />
          <Actions>
            <Button variant="primary" onClick={handleUpdate} disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </Button>
            <Button variant="empty" onClick={() => setEditing(false)} disabled={loading}>
              Cancel
            </Button>
          </Actions>
        </Fragment>
      ) : (
        <Fragment>
          {isDescriptionEmpty ? (
            <EmptyLabel onClick={() => setEditing(true)}>Add a description...</EmptyLabel>
          ) : (
            <TextEditedContent content={description} onClick={() => setEditing(true)} />
          )}
        </Fragment>
      )}
    </Fragment>
  );
};

Description.propTypes = propTypes;

export default Description;
