import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Select } from '@/components/ui/select';

describe('Select Component', () => {
  it('renders with children options', () => {
    render(
      <Select>
        <option value="">Select an option</option>
        <option value="1">Option 1</option>
        <option value="2">Option 2</option>
      </Select>
    );

    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    expect(screen.getByText('Select an option')).toBeInTheDocument();
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
  });

  it('handles selection changes', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(
      <Select onChange={handleChange}>
        <option value="">Select</option>
        <option value="opt1">Option 1</option>
        <option value="opt2">Option 2</option>
      </Select>
    );

    const select = screen.getByRole('combobox');
    await user.selectOptions(select, 'opt1');

    expect(handleChange).toHaveBeenCalled();
    expect(select).toHaveValue('opt1');
  });

  it('displays error message', () => {
    render(
      <Select error="Please select an option">
        <option value="">Select</option>
      </Select>
    );

    const errorMessage = screen.getByRole('alert');
    expect(errorMessage).toHaveTextContent('Please select an option');
  });

  it('shows error styling when error prop is set', () => {
    render(
      <Select error="Error" data-testid="select">
        <option value="">Select</option>
      </Select>
    );

    const select = screen.getByRole('combobox');
    expect(select).toHaveAttribute('aria-invalid', 'true');
    expect(select.className).toContain('border-red');
  });

  it('can be disabled', () => {
    render(
      <Select disabled>
        <option value="">Disabled Select</option>
      </Select>
    );

    const select = screen.getByRole('combobox');
    expect(select).toBeDisabled();
  });

  it('applies custom className', () => {
    render(
      <Select className="custom-select">
        <option value="">Custom</option>
      </Select>
    );

    const select = screen.getByRole('combobox');
    expect(select.className).toContain('custom-select');
  });

  it('forwards ref correctly', () => {
    const ref = vi.fn();
    render(
      <Select ref={ref}>
        <option value="">Ref Select</option>
      </Select>
    );
    expect(ref).toHaveBeenCalled();
  });

  it('supports required attribute', () => {
    render(
      <Select required>
        <option value="">Required Select</option>
      </Select>
    );

    const select = screen.getByRole('combobox');
    expect(select).toBeRequired();
  });

  it('supports name attribute for form submission', () => {
    render(
      <Select name="category">
        <option value="">Select Category</option>
      </Select>
    );

    const select = screen.getByRole('combobox');
    expect(select).toHaveAttribute('name', 'category');
  });

  it('has appearance-none styling for custom dropdown icon', () => {
    render(
      <Select data-testid="select">
        <option value="">Select</option>
      </Select>
    );

    const select = screen.getByRole('combobox');
    expect(select.className).toContain('appearance-none');
  });

  it('renders with chevron icon', () => {
    const { container } = render(
      <Select>
        <option value="">Select</option>
      </Select>
    );

    // Check for the chevron icon (SVG element)
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg?.className).toContain('pointer-events-none');
  });

  it('handles focus and blur events', () => {
    const handleFocus = vi.fn();
    const handleBlur = vi.fn();

    render(
      <Select onFocus={handleFocus} onBlur={handleBlur}>
        <option value="">Focus test</option>
      </Select>
    );

    const select = screen.getByRole('combobox');

    fireEvent.focus(select);
    expect(handleFocus).toHaveBeenCalledTimes(1);

    fireEvent.blur(select);
    expect(handleBlur).toHaveBeenCalledTimes(1);
  });
});

describe('Select Usage in Permission Please Context', () => {
  it('works for student selection', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(
      <Select name="studentId" onChange={handleChange}>
        <option value="">Select a student</option>
        <option value="student-1">Jane Doe (Grade 3)</option>
        <option value="student-2">John Doe (Grade 5)</option>
      </Select>
    );

    const select = screen.getByRole('combobox');
    await user.selectOptions(select, 'student-1');

    expect(select).toHaveValue('student-1');
    expect(handleChange).toHaveBeenCalled();
  });

  it('works for event type selection', () => {
    render(
      <Select name="eventType">
        <option value="">Select event type</option>
        <option value="FIELD_TRIP">Field Trip</option>
        <option value="ACTIVITY">Activity</option>
        <option value="MEDICAL">Medical</option>
        <option value="PHOTO_RELEASE">Photo Release</option>
      </Select>
    );

    expect(screen.getByText('Field Trip')).toBeInTheDocument();
    expect(screen.getByText('Activity')).toBeInTheDocument();
    expect(screen.getByText('Medical')).toBeInTheDocument();
    expect(screen.getByText('Photo Release')).toBeInTheDocument();
  });
});
