import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { message } from 'antd';
import CentralizedBookGenerator from '../components/CentralizedBookGenerator';
import { bookGenerationAPI } from '../api/bookGeneration';

// Mock the API
jest.mock('../api/bookGeneration');
const mockBookGenerationAPI = bookGenerationAPI as jest.Mocked<typeof bookGenerationAPI>;

// Mock antd message
jest.mock('antd', () => ({
  ...jest.requireActual('antd'),
  message: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
  },
}));

describe('CentralizedBookGenerator Integration Tests', () => {
  const mockProps = {
    visible: true,
    onClose: jest.fn(),
    boxId: 'TEST-BOX-001',
    onSuccess: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders configuration step initially', () => {
    render(<CentralizedBookGenerator {...mockProps} />);
    
    expect(screen.getByText('Configure & Validate')).toBeInTheDocument();
    expect(screen.getByLabelText(/PetroTrade Serial Number/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Number of Books/)).toBeInTheDocument();
  });

  test('validates request successfully', async () => {
    const mockValidationResult = {
      is_valid: true,
      estimated_books: 50,
      first_book_range: '001-050',
      last_book_range: '2451-2500',
      estimated_coupons: 2500,
      warnings: [],
      errors: [],
    };

    mockBookGenerationAPI.validateRequest.mockResolvedValue({
      data: mockValidationResult,
    });

    render(<CentralizedBookGenerator {...mockProps} />);

    // Fill form
    fireEvent.change(screen.getByLabelText(/PetroTrade Serial Number/), {
      target: { value: 'PT2024001' },
    });
    fireEvent.change(screen.getByLabelText(/Number of Books/), {
      target: { value: '50' },
    });

    // Click validate
    fireEvent.click(screen.getByText('Validate & Continue'));

    await waitFor(() => {
      expect(mockBookGenerationAPI.validateRequest).toHaveBeenCalledWith({
        box_id: 'TEST-BOX-001',
        petrotrade_serial: 'PT2024001',
        num_books: 50,
      });
    });
  });

  test('handles validation errors', async () => {
    const mockValidationResult = {
      is_valid: false,
      errors: ['Invalid PetroTrade serial format'],
      warnings: [],
    };

    mockBookGenerationAPI.validateRequest.mockResolvedValue({
      data: mockValidationResult,
    });

    render(<CentralizedBookGenerator {...mockProps} />);

    fireEvent.change(screen.getByLabelText(/PetroTrade Serial Number/), {
      target: { value: 'INVALID' },
    });
    fireEvent.change(screen.getByLabelText(/Number of Books/), {
      target: { value: '50' },
    });

    fireEvent.click(screen.getByText('Validate & Continue'));

    await waitFor(() => {
      expect(screen.getByText('Invalid PetroTrade serial format')).toBeInTheDocument();
    });
  });

  test('generates books successfully', async () => {
    // Mock validation success
    const mockValidationResult = {
      is_valid: true,
      estimated_books: 50,
      first_book_range: '001-050',
      last_book_range: '2451-2500',
      estimated_coupons: 2500,
      warnings: [],
      errors: [],
    };

    mockBookGenerationAPI.validateRequest.mockResolvedValue({
      data: mockValidationResult,
    });

    // Mock generation success
    const mockGenerationResult = {
      success: true,
      message: 'Books generated successfully',
      books_generated: 50,
      total_coupons: 2500,
      serial_ranges: [
        { book_number: 1, first_coupon: 'PT2024001001', last_coupon: 'PT2024001050' },
        { book_number: 50, first_coupon: 'PT2024002451', last_coupon: 'PT2024002500' },
      ],
    };

    mockBookGenerationAPI.generateBooks.mockResolvedValue({
      data: mockGenerationResult,
    });

    render(<CentralizedBookGenerator {...mockProps} />);

    // Step 1: Validate
    fireEvent.change(screen.getByLabelText(/PetroTrade Serial Number/), {
      target: { value: 'PT2024001' },
    });
    fireEvent.change(screen.getByLabelText(/Number of Books/), {
      target: { value: '50' },
    });
    fireEvent.click(screen.getByText('Validate & Continue'));

    await waitFor(() => {
      expect(screen.getByText('Review & Generate')).toBeInTheDocument();
    });

    // Step 2: Generate
    fireEvent.click(screen.getByText('Generate Books'));

    await waitFor(() => {
      expect(mockBookGenerationAPI.generateBooks).toHaveBeenCalledWith({
        box_id: 'TEST-BOX-001',
        petrotrade_serial: 'PT2024001',
        num_books: 50,
      });
    });

    await waitFor(() => {
      expect(screen.getByText('Complete')).toBeInTheDocument();
      expect(screen.getByText('Books generated successfully')).toBeInTheDocument();
    });
  });

  test('handles generation errors', async () => {
    // Mock validation success
    const mockValidationResult = {
      is_valid: true,
      estimated_books: 50,
      first_book_range: '001-050',
      last_book_range: '2451-2500',
      estimated_coupons: 2500,
      warnings: [],
      errors: [],
    };

    mockBookGenerationAPI.validateRequest.mockResolvedValue({
      data: mockValidationResult,
    });

    // Mock generation error
    mockBookGenerationAPI.generateBooks.mockRejectedValue(new Error('Server error'));

    render(<CentralizedBookGenerator {...mockProps} />);

    // Step 1: Validate
    fireEvent.change(screen.getByLabelText(/PetroTrade Serial Number/), {
      target: { value: 'PT2024001' },
    });
    fireEvent.change(screen.getByLabelText(/Number of Books/), {
      target: { value: '50' },
    });
    fireEvent.click(screen.getByText('Validate & Continue'));

    await waitFor(() => {
      expect(screen.getByText('Review & Generate')).toBeInTheDocument();
    });

    // Step 2: Generate
    fireEvent.click(screen.getByText('Generate Books'));

    await waitFor(() => {
      expect(message.error).toHaveBeenCalledWith('Error generating books: Server error');
    });
  });

  test('calls onSuccess after successful generation', async () => {
    // Mock successful flow
    const mockValidationResult = {
      is_valid: true,
      estimated_books: 50,
      first_book_range: '001-050',
      last_book_range: '2451-2500',
      estimated_coupons: 2500,
      warnings: [],
      errors: [],
    };

    mockBookGenerationAPI.validateRequest.mockResolvedValue({
      data: mockValidationResult,
    });

    const mockGenerationResult = {
      success: true,
      message: 'Books generated successfully',
      books_generated: 50,
      total_coupons: 2500,
      serial_ranges: [],
    };

    mockBookGenerationAPI.generateBooks.mockResolvedValue({
      data: mockGenerationResult,
    });

    render(<CentralizedBookGenerator {...mockProps} />);

    // Complete the flow
    fireEvent.change(screen.getByLabelText(/PetroTrade Serial Number/), {
      target: { value: 'PT2024001' },
    });
    fireEvent.change(screen.getByLabelText(/Number of Books/), {
      target: { value: '50' },
    });
    fireEvent.click(screen.getByText('Validate & Continue'));

    await waitFor(() => {
      expect(screen.getByText('Review & Generate')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Generate Books'));

    await waitFor(() => {
      expect(screen.getByText('Complete')).toBeInTheDocument();
    });

    // Click Done
    fireEvent.click(screen.getByText('Done'));

    expect(mockProps.onSuccess).toHaveBeenCalled();
  });

  test('closes modal when cancel is clicked', () => {
    render(<CentralizedBookGenerator {...mockProps} />);

    fireEvent.click(screen.getByText('Cancel'));

    expect(mockProps.onClose).toHaveBeenCalled();
  });
});
