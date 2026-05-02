import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ChatBubble } from './ChatBubble';

describe('ChatBubble', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('opens and closes chat bubble', async () => {
    render(<ChatBubble />);
    const toggle = screen.getByRole('button', { name: /open voting oracle/i });
    
    // Open
    fireEvent.click(toggle);
    expect(screen.getByRole('dialog', { name: /voting oracle chat/i })).toBeInTheDocument();
    
    // Close
    const closeBtn = screen.getByRole('button', { name: /close voting oracle/i });
    fireEvent.click(closeBtn);
    
    // Animate out requires time to pass for framer-motion, but we mocked timers
    // For RTL + framer-motion it might be completely removed. Wait for it:
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('shows loading state and streams response', async () => {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n'));
        controller.enqueue(new TextEncoder().encode('data: {"choices":[{"delta":{"content":" World"}}]}\n\n'));
        controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
        controller.close();
      }
    });

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      body: stream
    });

    render(<ChatBubble />);
    fireEvent.click(screen.getByRole('button', { name: /open voting oracle/i }));
    
    const input = screen.getByPlaceholderText(/ask the oracle/i);
    await userEvent.type(input, 'Hi');
    fireEvent.click(screen.getByRole('button', { name: /send/i }));

    expect(screen.getByText('Hi')).toBeInTheDocument();
    expect(screen.getByText(/the oracle is thinking/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/hello world/i)).toBeInTheDocument();
    });
  });

  it('handles errors', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'AI is not configured. Please check your API key.' })
    });

    render(<ChatBubble />);
    fireEvent.click(screen.getByRole('button', { name: /open/i }));

    const input = screen.getByPlaceholderText(/ask the oracle/i);
    await userEvent.type(input, 'Hi');
    fireEvent.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByText('AI is not configured. Please check your API key.')).toBeInTheDocument();
    });
  });

  it('cancels fetch on close (AbortController cleanup)', async () => {
    let abortSignal: AbortSignal;
    (global.fetch as any).mockImplementationOnce((url: string, options: RequestInit) => {
      abortSignal = options.signal!;
      return new Promise(() => {}); // hang forever
    });

    render(<ChatBubble />);
    fireEvent.click(screen.getByRole('button', { name: /open/i }));

    const input = screen.getByPlaceholderText(/ask the oracle/i);
    await userEvent.type(input, 'Hi');
    fireEvent.click(screen.getByRole('button', { name: /send/i }));

    // Now close it
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    
    // It should abort the signal
    await waitFor(() => {
      expect(abortSignal.aborted).toBe(true);
    });
  });
});
