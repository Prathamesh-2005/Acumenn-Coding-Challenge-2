import React, { Fragment, useState } from 'react';
import PropTypes from 'prop-types';
import { isNil } from 'lodash';

import supabase from 'config/supaBaseConfig';
import { InputDebounced, Modal, Button } from 'shared/components';

import TrackingWidget from './TrackingWidget';
import { SectionTitle } from '../Styles';
import {
  TrackingLink,
  ModalContents,
  ModalTitle,
  Inputs,
  InputCont,
  InputLabel,
  Actions,
} from './Styles';

const ProjectBoardIssueDetailsEstimateTracking = ({ issue, updateIssue }) => {
  const [localIssue, setLocalIssue] = useState(issue);
  const [error, setError] = useState(null);

  const handleUpdate = async (fieldName, value) => {
    try {
      setError(null);

      const { data, error: updateError } = await supabase
        .from('issue')
        .update({ [fieldName]: value })
        .eq('id', issue.id)
        .select()
        .single();

      if (updateError) throw updateError;

      setLocalIssue(prev => ({ ...prev, [fieldName]: value }));

      if (updateIssue) {
        updateIssue({ ...localIssue, [fieldName]: value });
      }
    } catch (err) {
      console.error('Supabase update error:', err.message);
      setError('Failed to update time fields. Please try again.');
    }
  };

  return (
    <Fragment>
      <SectionTitle>Original Estimate (hours)</SectionTitle>
      {renderHourInput('estimate', localIssue, handleUpdate)}

      <SectionTitle>Time Tracking</SectionTitle>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <Modal
        testid="modal:tracking"
        width={400}
        renderLink={modal => (
          <TrackingLink onClick={modal.open}>
            <TrackingWidget issue={localIssue} />
          </TrackingLink>
        )}
        renderContent={modal => (
          <ModalContents>
            <ModalTitle>Time tracking</ModalTitle>
            <TrackingWidget issue={localIssue} />
            <Inputs>
              <InputCont>
                <InputLabel>Time spent (hours)</InputLabel>
                {renderHourInput('timeSpent', localIssue, handleUpdate)}
              </InputCont>
              <InputCont>
                <InputLabel>Time remaining (hours)</InputLabel>
                {renderHourInput('timeRemaining', localIssue, handleUpdate)}
              </InputCont>
            </Inputs>
            <Actions>
              <Button variant="primary" onClick={modal.close}>
                Done
              </Button>
            </Actions>
          </ModalContents>
        )}
      />
    </Fragment>
  );
};

const renderHourInput = (fieldName, issue, handleUpdate) => (
  <InputDebounced
    placeholder="Number"
    filter={/^\d{0,6}$/}
    value={isNil(issue[fieldName]) ? '' : issue[fieldName]}
    onChange={stringValue => {
      const value = stringValue.trim() ? Number(stringValue) : null;
      handleUpdate(fieldName, value);
    }}
  />
);

ProjectBoardIssueDetailsEstimateTracking.propTypes = {
  issue: PropTypes.shape({
    id: PropTypes.string.isRequired,
    estimate: PropTypes.number,
    timeSpent: PropTypes.number,
    timeRemaining: PropTypes.number,
  }).isRequired,
  updateIssue: PropTypes.func,
};

export default ProjectBoardIssueDetailsEstimateTracking;
