import configureStore from 'redux-mock-store';
import renderer from 'react-test-renderer';
import LoginInfos from '../loginInfos';
import { Provider } from 'react-redux';

/*
**  'npm test' to run test (and create a snapshot if new test)
**    if a test fails:
**      - it's a bug, so resolve it
**      - it's normal behavior for edited comp (so type u or i to update snapshot).
**
**    if you edit a *.test.tsx file directly, type u after 'npm test'
**    to remove obsolete snapshot
*/

test('<LoginInfos /> display username if bool is set to true', () => {
  const mockStoreConf = configureStore([]);
  
  let mockStore = mockStoreConf({user: {
    username: "pminne",
    isConnected: true,
  }});

  const component = renderer.create(
    <Provider store={mockStore}>
      <LoginInfos />
    </Provider>
  );

  let tree = component.toJSON();
  expect(tree).toMatchSnapshot();
})

test('<LoginInfos /> don\'t display username if bool is set to false', () => {
  const mockStoreConf = configureStore([]);
  
  let mockStore = mockStoreConf({user: {
    username: "pminne",
    isConnected: false,
  }});

  const component = renderer.create(
    <Provider store={mockStore}>
      <LoginInfos />
    </Provider>
  );

  let tree = component.toJSON();
  expect(tree).toMatchSnapshot();
})