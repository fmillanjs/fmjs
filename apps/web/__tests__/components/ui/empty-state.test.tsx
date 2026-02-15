import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyState } from '@/components/ui/empty-state';
import { Inbox } from 'lucide-react';

describe('EmptyState Component', () => {
  it('should render title and description', () => {
    render(
      <EmptyState
        icon={Inbox}
        title="No items found"
        description="There are no items to display at the moment"
      />
    );

    expect(screen.getByText('No items found')).toBeInTheDocument();
    expect(screen.getByText('There are no items to display at the moment')).toBeInTheDocument();
  });

  it('should render icon', () => {
    const { container } = render(
      <EmptyState
        icon={Inbox}
        title="No items found"
        description="There are no items to display"
      />
    );

    // Check for svg element (lucide icons render as svg)
    const svgElement = container.querySelector('svg');
    expect(svgElement).toBeInTheDocument();
  });

  it('should render action button when provided', () => {
    render(
      <EmptyState
        icon={Inbox}
        title="No items found"
        description="There are no items to display"
        action={<button>Create New Item</button>}
      />
    );

    expect(screen.getByText('Create New Item')).toBeInTheDocument();
  });

  it('should not render action when not provided', () => {
    const { container } = render(
      <EmptyState
        icon={Inbox}
        title="No items found"
        description="There are no items to display"
      />
    );

    // The action div should not be rendered
    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBe(0);
  });

  it('should have correct structure and styling classes', () => {
    const { container } = render(
      <EmptyState
        icon={Inbox}
        title="No items found"
        description="There are no items to display"
      />
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('flex');
    expect(wrapper.className).toContain('flex-col');
    expect(wrapper.className).toContain('items-center');
  });
});
