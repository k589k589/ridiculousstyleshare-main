import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';

const queryClient = new QueryClient();

const renderWithProviders = (ui: React.ReactNode) => {
    return render(
        <QueryClientProvider client={queryClient}>
            <TooltipProvider>
                {ui}
            </TooltipProvider>
        </QueryClientProvider>
    );
};

describe('App', () => {
    it('renders without crashing', () => {
        renderWithProviders(<App />);
        // Since App likely renders routes, we might not see specific text immediately without navigation,
        // but successful render is a good first step.
        // Let's check for something generic or just ensure it doesn't throw.
        expect(document.body).toBeInTheDocument();
    });
});
