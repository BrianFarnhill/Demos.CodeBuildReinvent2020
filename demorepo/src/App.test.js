import React from 'react';
import { render } from '@testing-library/react';
import App from './App';

test('renders learn react link', () => {
  const { getByText } = render(<App />);
  const linkElement = getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});

test('Pointless environment variable matches expected value', () => {
  const { POINTLESS } = process.env;
  expect(POINTLESS).toBe("Hello World!");
});
