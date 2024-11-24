import cx from 'classnames';
import { useCallback } from 'react';
import { useNavigate, Link, generatePath } from 'react-router-dom';

import { useClient } from '@dxos/react-client';
import { type Space, useSpaces } from '@dxos/react-client/echo';
import { humanize } from '@dxos/util';

// import { createTodoList } from '../types';

export const SpaceList = ({ current }: { current?: Space }) => {
  const client = useClient();
  const spaces = useSpaces();
  const navigate = useNavigate();

  const handleJoin = async () => {
    const { space } = await client.shell.joinSpace();
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    space && navigate(generatePath('/:spaceId', { spaceId: space.id }));
  };

  const handleCreateAccount = useCallback(async () => {
    const space = await client.spaces.create();
    // createTodoList(space);
    navigate(generatePath('/:spaceId', { spaceId: space.id }));
  }, [client, navigate]);

  return (
    <div id='spaces'>
      <div className='flex'>
        <h2>Spaces</h2>
        <div className='flex-grow'></div>
        <button onClick={handleCreateAccount} data-testid='add-button'>
          +
        </button>
        <button onClick={() => current && client.shell.shareSpace({ spaceId: current.id })} data-testid='share-button'>
          ↸
        </button>
        <button id='' onClick={handleJoin} data-testid='join-button'>
          ⇲
        </button>
      </div>
      <ul>
        {spaces.map((space) => {
          const key = space.id;
          const isSelected = current?.id === space.id;
          return (
            <Link key={key} to={`/${key}`} className={cx(isSelected && 'selected')}>
              <li>{humanize(key)}</li>
            </Link>
          );
        })}
      </ul>
    </div>
  );
};