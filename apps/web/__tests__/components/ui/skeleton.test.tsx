import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Skeleton } from '@/components/ui/skeleton';

describe('Skeleton Component', () => {
  it('should render with animate-pulse class', () => {
    const { container } = render(<Skeleton />);
    const skeletonElement = container.firstChild as HTMLElement;

    expect(skeletonElement).toBeInTheDocument();
    expect(skeletonElement.className).toContain('animate-pulse');
  });

  it('should accept and apply custom className', () => {
    const { container } = render(<Skeleton className="w-20 h-4" />);
    const skeletonElement = container.firstChild as HTMLElement;

    expect(skeletonElement.className).toContain('w-20');
    expect(skeletonElement.className).toContain('h-4');
    expect(skeletonElement.className).toContain('animate-pulse');
  });

  it('should render as a div element', () => {
    const { container } = render(<Skeleton />);
    const skeletonElement = container.firstChild as HTMLElement;

    expect(skeletonElement.tagName.toLowerCase()).toBe('div');
  });

  it('should have background color classes', () => {
    const { container } = render(<Skeleton />);
    const skeletonElement = container.firstChild as HTMLElement;

    // Should have either light or dark mode background
    const hasBackgroundClass =
      skeletonElement.className.includes('bg-gray-200') ||
      skeletonElement.className.includes('dark:bg-gray-700');

    expect(hasBackgroundClass).toBe(true);
  });
});
