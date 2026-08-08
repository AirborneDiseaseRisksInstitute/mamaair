/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

jest.mock('../src/App/AppRoot', () => ({
  AppRoot: () => null,
}));

jest.mock('../src/i18n', () => ({}));

import App from '../App';

test('renders the application shell correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
