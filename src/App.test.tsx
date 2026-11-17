import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';

import App from './App';

test('renders the Estudia home screen', () => {
  render(<App />);
  expect(screen.getByRole('navigation', { name: 'Navegación principal' })).toBeInTheDocument();
  expect(screen.getAllByText('Inicio').length).toBeGreaterThan(0);
});
