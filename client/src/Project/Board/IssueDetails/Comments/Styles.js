import styled from 'styled-components';

import { color, font, mixin } from 'shared/utils/styles';
import { Avatar } from 'shared/components';

export const Title = styled.div`
  margin-bottom: 20px;
  ${font.medium}
  ${font.size(20)}
`;

export const CommentsWrapper = styled.div`
  margin-top: 20px;
`;

export const CommentsList = styled.div`
  display: flex;
  flex-direction: column;
`;

export const Comment = styled.div`
  position: relative;
  margin-top: 25px;
  ${font.size(15)}
`;

export const CommentHeader = styled.div`
  display: flex;
  justify-content: space-between;
  padding-bottom: 12px;
  color: ${color.textDark};
  ${font.medium}
`;

export const UserAvatar = styled(Avatar)`
  position: absolute;
  top: 0;
  left: 0;
`;

export const Content = styled.div`
  padding-left: 10px;
`;

export const Username = styled.div`
  display: inline-block;
  padding-right: 12px;
  padding-bottom: 10px;
  color: ${color.textDark};
  ${font.medium}
`;

export const CreatedAt = styled.div`
  display: inline-block;
  padding-bottom: 10px;
  color: ${color.textDark};
  ${font.size(14.5)}
`;

export const Body = styled.p`
  padding-bottom: 10px;
  white-space: pre-wrap;
`;

export const Actions = styled.div`
  display: flex;
  padding-top: 6px;
`;

export const FormButton = styled.button`
  margin-right: 6px;
  ${mixin.clickable}
  ${font.medium}
  ${font.size(14.5)}
  
  &:disabled {
    opacity: 0.6;
    cursor: default;
  }

  ${props => props.variant === 'primary' && `
    color: #fff;
    background: ${color.primary};
    border-radius: 3px;
    padding: 6px 12px;
    &:not(:disabled):hover {
      background: ${color.primaryHover};
    }
  `}

  ${props => props.variant === 'empty' && `
    color: ${color.textMedium};
    background: none;
    &:not(:disabled):hover {
      text-decoration: underline;
    }
  `}

  ${props => props.isWorking && `
    pointer-events: none;
    opacity: 0.7;
  `}
`;

export const EditLink = styled.div`
  margin-right: 12px;
  color: ${color.textMedium};
  ${font.size(14.5)}
  ${mixin.clickable}
  &:hover {
    text-decoration: underline;
  }
`;

export const DeleteLink = styled.div`
  color: ${color.textMedium};
  ${font.size(14.5)}
  ${mixin.clickable}
  &:hover {
    text-decoration: underline;
  }
  &:before {
    position: relative;
    right: 6px;
    content: '·';
    display: inline-block;
  }
`;

export const Comments = styled.div`
  margin-top: 20px;
`;
