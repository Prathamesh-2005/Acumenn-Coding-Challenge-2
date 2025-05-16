import React from 'react';
import PropTypes from 'prop-types';

const propTypes = {
  setFormOpen: PropTypes.func.isRequired,
};

const ProjectBoardIssueDetailsCommentsCreateProTip = ({ setFormOpen }) => {
  return (
    <div
      style={{
        padding: 10,
        fontSize: 13,
        color: '#5E6C84',
      }}
    >
      <span>Pro tip: press</span>
      <span
        style={{
          margin: '0 3px',
          padding: '1px 2px',
          backgroundColor: '#F4F5F7',
          borderRadius: 2,
          color: '#5E6C84',
        }}
      >
        M
      </span>
      <span>to comment</span>
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          top: 0,
          left: 0,
          cursor: 'pointer',
        }}
        onClick={() => setFormOpen(true)}
      />
    </div>
  );
};

ProjectBoardIssueDetailsCommentsCreateProTip.propTypes = propTypes;

export default ProjectBoardIssueDetailsCommentsCreateProTip;