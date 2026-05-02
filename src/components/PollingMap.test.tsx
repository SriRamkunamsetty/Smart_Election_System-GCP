import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PollingMap } from './PollingMap';

describe('PollingMap', () => {
  it('renders fallback loading state initially', () => {
    // If we mock import(), we can guarantee it stays in fallback state
    // But testing the initial render is sufficient
    render(<PollingMap />);
    expect(screen.getByText(/loading map/i)).toBeInTheDocument();
  });
});
