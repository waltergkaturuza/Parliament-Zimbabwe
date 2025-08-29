// Clear hardcoded notification data and reset localStorage
// This script should be run once to clear any cached mock data

export const clearNotificationCache = () => {
  try {
    // Clear any notification-related localStorage items
    const keysToRemove = [
      'notification_stats',
      'notification_cache',
      'mock_notifications',
      'fake_notifications',
      'hardcoded_stats'
    ];
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    
    // Clear any sessionStorage items
    keysToRemove.forEach(key => {
      sessionStorage.removeItem(key);
    });
    
    console.log('✅ Notification cache cleared successfully');
    
  } catch (error) {
    console.error('❌ Error clearing notification cache:', error);
  }
};

// Auto-clear cache on app load (run once per session)
export const initializeClearCache = () => {
  if (typeof window !== 'undefined') {
    // Check if we've already cleared cache in this session
    const cacheCleared = sessionStorage.getItem('notification_cache_cleared');
    
    if (!cacheCleared) {
      clearNotificationCache();
      sessionStorage.setItem('notification_cache_cleared', 'true');
    }
  }
};
