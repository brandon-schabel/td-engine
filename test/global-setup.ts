// Global setup that runs before any modules are imported
if (typeof window === 'undefined') {
  const mockDocument = {
    createElement: () => ({
      style: {},
      addEventListener: () => {},
      removeEventListener: () => {},
    }),
    body: {
      appendChild: () => {},
      removeChild: () => {},
    },
    addEventListener: () => {},
    removeEventListener: () => {},
  };
  
  (global as any).window = {
    addEventListener: () => {},
    removeEventListener: () => {},
    document: mockDocument,
    navigator: { userAgent: '' }
  };
  (global as any).document = mockDocument;
}