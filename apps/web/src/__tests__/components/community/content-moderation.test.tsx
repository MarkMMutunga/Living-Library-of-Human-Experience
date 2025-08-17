import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ContentModeration from '@/components/community/content-moderation';

// Mock fetch
global.fetch = jest.fn();

describe('ContentModeration Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        items: [
          {
            id: '1',
            type: 'fragment',
            title: 'Test Fragment',
            content: 'Test content',
            reportedBy: 'user123',
            reportReason: 'Test reason',
            severity: 'medium',
            status: 'pending',
            createdAt: '2025-08-17T10:30:00Z',
            aiConfidence: 0.75,
            reportCount: 2
          }
        ]
      })
    });
  });

  it('renders the moderation interface', async () => {
    render(<ContentModeration />);
    
    expect(screen.getByText('Content Moderation')).toBeInTheDocument();
    expect(screen.getByText('Pending Review')).toBeInTheDocument();
    expect(screen.getByText('High Priority')).toBeInTheDocument();
  });

  it('displays moderation stats', async () => {
    render(<ContentModeration />);
    
    await waitFor(() => {
      expect(screen.getByText('12')).toBeInTheDocument(); // Pending count
      expect(screen.getByText('48')).toBeInTheDocument(); // Approved count
      expect(screen.getByText('8')).toBeInTheDocument();  // Rejected count
      expect(screen.getByText('94%')).toBeInTheDocument(); // AI Accuracy
    });
  });

  it('allows filtering moderation items', async () => {
    render(<ContentModeration />);
    
    const allItemsButton = screen.getByText('All Items');
    const pendingButton = screen.getByText('Pending Review');
    const highPriorityButton = screen.getByText('High Priority');
    
    expect(allItemsButton).toBeInTheDocument();
    expect(pendingButton).toBeInTheDocument();
    expect(highPriorityButton).toBeInTheDocument();
    
    fireEvent.click(allItemsButton);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('filter=all'));
    
    fireEvent.click(highPriorityButton);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('filter=high-priority'));
  });

  it('handles moderation actions', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          items: [
            {
              id: '1',
              type: 'fragment',
              title: 'Test Fragment',
              content: 'Test content',
              reportedBy: 'user123',
              reportReason: 'Test reason',
              severity: 'medium',
              status: 'pending',
              createdAt: '2025-08-17T10:30:00Z',
              aiConfidence: 0.75,
              reportCount: 2
            }
          ]
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

    render(<ContentModeration />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Fragment')).toBeInTheDocument();
    });
    
    const approveButton = screen.getByText('Approve');
    fireEvent.click(approveButton);
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'PATCH',
          body: expect.stringContaining('approve')
        })
      );
    });
  });

  it('displays empty state when no items', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ items: [] })
    });
    
    render(<ContentModeration />);
    
    await waitFor(() => {
      expect(screen.getByText('All caught up!')).toBeInTheDocument();
      expect(screen.getByText('No items require moderation at this time.')).toBeInTheDocument();
    });
  });

  it('displays loading state initially', () => {
    render(<ContentModeration />);
    
    // Should show loading skeletons
    const loadingElements = screen.getAllByRole('generic');
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  it('displays severity badges correctly', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        items: [
          {
            id: '1',
            type: 'fragment',
            title: 'High Severity Item',
            content: 'Test content',
            reportedBy: 'user123',
            reportReason: 'Serious violation',
            severity: 'high',
            status: 'pending',
            createdAt: '2025-08-17T10:30:00Z',
            aiConfidence: 0.95,
            reportCount: 5
          }
        ]
      })
    });
    
    render(<ContentModeration />);
    
    await waitFor(() => {
      expect(screen.getByText('HIGH')).toBeInTheDocument();
      expect(screen.getByText('5 reports')).toBeInTheDocument();
    });
  });
});
