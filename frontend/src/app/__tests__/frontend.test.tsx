import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Footer from '../../components/Footer';
import Home from '../page';
import TransactionCenterToast from '../../components/TransactionCenterToast';
import { useTxStore } from '../../state/txStore';

// Test 1: Footer Rendering
describe('Footer Component', () => {
  it('renders copyright and security details successfully', () => {
    render(<Footer />);
    expect(screen.getAllByText(/VEDA/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/SECURED CRYPTOGRAPHICALLY BY STELLAR/i)).toBeInTheDocument();
  });
});

// Test 2: Landing Page Interactivity
describe('Landing Page', () => {
  it('renders title and allows loading the demo certificate hash', () => {
    render(<Home />);
    
    // Check main headline
    expect(screen.getByText(/Decentralized Credential Verification/i)).toBeInTheDocument();

    // Check search button exists
    expect(screen.getByRole('button', { name: /VERIFY/i })).toBeInTheDocument();

    // Click demo hash trigger
    const demoButton = screen.getByText(/Load Demo Certificate ID/i);
    fireEvent.click(demoButton);

    // Verify input value populated
    const input = screen.getByPlaceholderText(/Enter 32-byte Certificate Hash/i) as HTMLInputElement;
    expect(input.value).toContain('0xabc123');
  });
});

// Test 3: Transaction Center Toast states
describe('TransactionCenterToast Component', () => {
  it('does not render when transaction status is idle', () => {
    useTxStore.setState({ status: 'idle' });
    const { container } = render(<TransactionCenterToast />);
    expect(container.firstChild).toBeNull();
  });

  it('renders progress loader when transaction is pending', () => {
    useTxStore.setState({
      status: 'pending',
      description: 'Minting test degree...',
      txHash: null,
    });

    render(<TransactionCenterToast />);
    
    expect(screen.getByText(/Submitting.../i)).toBeInTheDocument();
    expect(screen.getByText(/Minting test degree.../i)).toBeInTheDocument();
  });

  it('renders success status when transaction is confirmed', () => {
    useTxStore.setState({
      status: 'confirmed',
      description: 'Revoked certificate successfully',
      txHash: '0xtesttxhash123',
    });

    render(<TransactionCenterToast />);
    
    expect(screen.getByText(/Transaction Confirmed!/i)).toBeInTheDocument();
    expect(screen.getByText(/View on StellarExpert/i)).toBeInTheDocument();
  });
});
