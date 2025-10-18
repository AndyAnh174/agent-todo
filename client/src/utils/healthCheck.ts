// Health check utility to verify server connection
export const checkServerHealth = async (): Promise<{ isHealthy: boolean; error?: string }> => {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
    const response = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      return { isHealthy: true };
    } else {
      return { 
        isHealthy: false, 
        error: `Server responded with status ${response.status}` 
      };
    }
  } catch (error) {
    return { 
      isHealthy: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

// Check if user is authenticated
export const checkAuth = (): boolean => {
  if (typeof window === 'undefined') return false;
  const token = localStorage.getItem('token');
  return !!token;
};

// Get API base URL
export const getApiBaseUrl = (): string => {
  return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
};
