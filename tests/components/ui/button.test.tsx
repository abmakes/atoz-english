import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/ui/button';

describe('Button Component', () => {
  // Test for expected use
  test('renders a button with text', () => {
    render(<Button>Test Button</Button>);
    const buttonElement = screen.getByRole('button', { name: /test button/i });
    expect(buttonElement).toBeInTheDocument();
  });

  // Test for different variants (edge case)
  test('applies the correct styles based on variant prop', () => {
    render(
      <Button variant="destructive" data-testid="destructive-button">
        Destructive Button
      </Button>
    );
    const buttonElement = screen.getByTestId('destructive-button');
    expect(buttonElement).toHaveClass('bg-destructive');
  });

  // Test for click functionality (failure case - disabled button)
  test('does not trigger onClick when disabled', async () => {
    const handleClick = jest.fn();
    render(
      <Button disabled onClick={handleClick}>
        Disabled Button
      </Button>
    );
    
    const buttonElement = screen.getByRole('button', { name: /disabled button/i });
    expect(buttonElement).toBeDisabled();
    
    await userEvent.click(buttonElement);
    expect(handleClick).not.toHaveBeenCalled();
  });
}); 