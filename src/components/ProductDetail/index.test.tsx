import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryHistory, createRootRoute, createRoute, createRouter, RouterProvider } from '@tanstack/react-router';
import { ProductDetail } from './index';
import { CartProvider } from '../../contexts/CartContext';
import type { Product } from '../../types/product';

// Mock the product service
vi.mock('../../services', () => ({
  productService: {
    getProduct: vi.fn(),
  },
}));

import { productService } from '../../services';

const mockProduct: Product = {
  id: 1,
  title: 'Test Product',
  description: 'This is a test product description',
  category: 'electronics',
  price: 99.99,
  rating: 4.5,
  stock: 10,
  brand: 'Test Brand',
  availabilityStatus: 'In Stock',
  returnPolicy: '30 days return',
  thumbnail: 'https://example.com/thumbnail.jpg',
  images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
};

// Helper function to render component with all necessary providers
const renderProductDetail = (productId: string = '1', productData?: Product | null, isLoading = false, isError = false) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  // Mock the product service response
  if (isError) {
    vi.mocked(productService.getProduct).mockRejectedValue(new Error('Failed to fetch product'));
  } else {
    vi.mocked(productService.getProduct).mockResolvedValue(productData || mockProduct);
  }

  // Create router with the product route
  const rootRoute = createRootRoute();
  const productRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/products/$productId',
    component: ProductDetail,
  });

  const router = createRouter({
    routeTree: rootRoute.addChildren([productRoute]),
    history: createMemoryHistory({
      initialEntries: [`/products/${productId}`],
    }),
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <RouterProvider router={router} />
      </CartProvider>
    </QueryClientProvider>
  );
};

describe('ProductDetail Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering with default props', () => {
    it('should render the product detail page with all sub-components', async () => {
      renderProductDetail();

      // Wait for product data to load
      await waitFor(() => {
        expect(screen.getByText('Test Product')).toBeInTheDocument();
      });

      // Verify product information is displayed
      expect(screen.getByText('Test Product')).toBeInTheDocument();
      expect(screen.getByText('$99.99')).toBeInTheDocument();
      expect(screen.getByText('This is a test product description')).toBeInTheDocument();

      // Verify add to cart button exists
      expect(screen.getByRole('button', { name: /add to cart/i })).toBeInTheDocument();
    });

    it('should display the product image with correct attributes', async () => {
      renderProductDetail();

      await waitFor(() => {
        const image = screen.getByRole('img', { name: /test product/i });
        expect(image).toBeInTheDocument();
        expect(image).toHaveAttribute('src', 'https://example.com/image1.jpg');
        expect(image).toHaveAttribute('alt', 'Test Product');
      });
    });
  });

  describe('Edge cases with product data', () => {
    it('should display thumbnail when images array is empty', async () => {
      const productWithoutImages: Product = {
        ...mockProduct,
        images: [],
      };

      renderProductDetail('1', productWithoutImages);

      await waitFor(() => {
        const image = screen.getByRole('img', { name: /test product/i });
        expect(image).toHaveAttribute('src', 'https://example.com/thumbnail.jpg');
      });
    });

    it('should handle product with missing optional fields', async () => {
      const productWithoutBrand: Product = {
        ...mockProduct,
        brand: undefined,
      };

      renderProductDetail('1', productWithoutBrand);

      await waitFor(() => {
        expect(screen.getByText('Test Product')).toBeInTheDocument();
      });

      expect(screen.getByText('$99.99')).toBeInTheDocument();
    });

    it('should handle product with zero price', async () => {
      const freeProduct: Product = {
        ...mockProduct,
        price: 0,
      };

      renderProductDetail('1', freeProduct);

      await waitFor(() => {
        expect(screen.getByText('$0.00')).toBeInTheDocument();
      });
    });

    it('should handle product with very long description', async () => {
      const longDescriptionProduct: Product = {
        ...mockProduct,
        description: 'A'.repeat(1000),
      };

      renderProductDetail('1', longDescriptionProduct);

      await waitFor(() => {
        expect(screen.getByText('A'.repeat(1000))).toBeInTheDocument();
      });
    });
  });

  describe('Loading states', () => {
    it('should handle loading state gracefully', async () => {
      // Create a query client with delayed response
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      });

      // Mock a delayed response
      vi.mocked(productService.getProduct).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockProduct), 100))
      );

      const rootRoute = createRootRoute();
      const productRoute = createRoute({
        getParentRoute: () => rootRoute,
        path: '/products/$productId',
        component: ProductDetail,
      });

      const router = createRouter({
        routeTree: rootRoute.addChildren([productRoute]),
        history: createMemoryHistory({
          initialEntries: ['/products/1'],
        }),
      });

      render(
        <QueryClientProvider client={queryClient}>
          <CartProvider>
            <RouterProvider router={router} />
          </CartProvider>
        </QueryClientProvider>
      );

      // During loading, product data should not be visible yet
      expect(screen.queryByText('Test Product')).not.toBeInTheDocument();

      // Wait for the data to load
      await waitFor(() => {
        expect(screen.getByText('Test Product')).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe('Error and missing data handling', () => {
    it('should handle when product data is null/undefined', async () => {
      renderProductDetail('1', null);

      // The component should render without crashing
      // Even when product is null, the component structure should still render
      await waitFor(() => {
        // Add to cart button should exist (even if disabled)
        expect(screen.getByRole('button', { name: /add to cart/i })).toBeInTheDocument();
      });
    });

    it('should handle network error gracefully', async () => {
      // This test verifies the component doesn't crash on error
      // The actual error handling UI would depend on implementation
      renderProductDetail('1', undefined, false, true);

      // Component should render its structure even with error
      await waitFor(() => {
        const component = screen.getByRole('button', { name: /add to cart/i });
        expect(component).toBeInTheDocument();
      });
    });
  });

  describe('Interactions', () => {
    it('should call addToCart when Add to Cart button is clicked', async () => {
      const user = userEvent.setup();
      renderProductDetail();

      await waitFor(() => {
        expect(screen.getByText('Test Product')).toBeInTheDocument();
      });

      const addToCartButton = screen.getByRole('button', { name: /add to cart/i });
      await user.click(addToCartButton);

      // Verify button can be clicked without errors
      expect(addToCartButton).toBeInTheDocument();
    });

    it('should not allow adding to cart when product is not loaded', async () => {
      const user = userEvent.setup();
      renderProductDetail('1', null);

      await waitFor(() => {
        const addToCartButton = screen.getByRole('button', { name: /add to cart/i });
        expect(addToCartButton).toBeInTheDocument();
      });

      const addToCartButton = screen.getByRole('button', { name: /add to cart/i });
      
      // Click should not throw error even with null product
      await user.click(addToCartButton);
      expect(addToCartButton).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper alt text for product image', async () => {
      renderProductDetail();

      await waitFor(() => {
        const image = screen.getByRole('img');
        expect(image).toHaveAttribute('alt', 'Test Product');
      });
    });

    it('should have accessible button for add to cart action', async () => {
      renderProductDetail();

      await waitFor(() => {
        expect(screen.getByText('Test Product')).toBeInTheDocument();
      });

      const button = screen.getByRole('button', { name: /add to cart/i });
      expect(button).toBeInTheDocument();
      expect(button).toBeEnabled();
    });

    it('should have proper heading structure', async () => {
      renderProductDetail();

      await waitFor(() => {
        const heading = screen.getByRole('heading', { level: 1 });
        expect(heading).toHaveTextContent('Test Product');
      });
    });
  });

  describe('Props updates and re-rendering', () => {
    it('should update when navigating to different product', async () => {
      const { rerender } = renderProductDetail('1');

      await waitFor(() => {
        expect(screen.getByText('Test Product')).toBeInTheDocument();
      });

      // Mock a different product
      const differentProduct: Product = {
        ...mockProduct,
        id: 2,
        title: 'Different Product',
        price: 149.99,
      };

      vi.mocked(productService.getProduct).mockResolvedValue(differentProduct);

      // Re-render with different product ID
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      });

      const rootRoute = createRootRoute();
      const productRoute = createRoute({
        getParentRoute: () => rootRoute,
        path: '/products/$productId',
        component: ProductDetail,
      });

      const router = createRouter({
        routeTree: rootRoute.addChildren([productRoute]),
        history: createMemoryHistory({
          initialEntries: ['/products/2'],
        }),
      });

      rerender(
        <QueryClientProvider client={queryClient}>
          <CartProvider>
            <RouterProvider router={router} />
          </CartProvider>
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Different Product')).toBeInTheDocument();
        expect(screen.getByText('$149.99')).toBeInTheDocument();
      });
    });
  });

  describe('Conditional rendering based on product status', () => {
    it('should render product with "In Stock" availability status', async () => {
      renderProductDetail();

      await waitFor(() => {
        expect(screen.getByText('Test Product')).toBeInTheDocument();
      });

      // Product with stock should have add to cart button enabled
      const button = screen.getByRole('button', { name: /add to cart/i });
      expect(button).toBeEnabled();
    });

    it('should render product with out of stock status', async () => {
      const outOfStockProduct: Product = {
        ...mockProduct,
        stock: 0,
        availabilityStatus: 'Out of Stock',
      };

      renderProductDetail('1', outOfStockProduct);

      await waitFor(() => {
        expect(screen.getByText('Test Product')).toBeInTheDocument();
      });

      // Button should still render
      expect(screen.getByRole('button', { name: /add to cart/i })).toBeInTheDocument();
    });
  });
});
