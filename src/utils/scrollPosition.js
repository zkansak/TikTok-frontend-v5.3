// 滚动位置管理工具

const SCROLL_POSITION_KEY = 'scroll_positions';

/**
 * 保存当前页面的滚动位置
 * @param {string} pathname - 路由路径
 * @param {number} scrollY - 滚动位置
 */
export const saveScrollPosition = (pathname, scrollY) => {
  try {
    const positions = JSON.parse(sessionStorage.getItem(SCROLL_POSITION_KEY) || '{}');
    positions[pathname] = scrollY;
    sessionStorage.setItem(SCROLL_POSITION_KEY, JSON.stringify(positions));
  } catch (error) {
    console.error('Error saving scroll position:', error);
  }
};

/**
 * 获取保存的滚动位置
 * @param {string} pathname - 路由路径
 * @returns {number} 滚动位置，如果没有则返回 0
 */
export const getScrollPosition = (pathname) => {
  try {
    const positions = JSON.parse(sessionStorage.getItem(SCROLL_POSITION_KEY) || '{}');
    return positions[pathname] || 0;
  } catch (error) {
    console.error('Error getting scroll position:', error);
    return 0;
  }
};

/**
 * 清除指定路径的滚动位置
 * @param {string} pathname - 路由路径
 */
export const clearScrollPosition = (pathname) => {
  try {
    const positions = JSON.parse(sessionStorage.getItem(SCROLL_POSITION_KEY) || '{}');
    delete positions[pathname];
    sessionStorage.setItem(SCROLL_POSITION_KEY, JSON.stringify(positions));
  } catch (error) {
    console.error('Error clearing scroll position:', error);
  }
};

/**
 * 清除所有滚动位置
 */
export const clearAllScrollPositions = () => {
  try {
    sessionStorage.removeItem(SCROLL_POSITION_KEY);
  } catch (error) {
    console.error('Error clearing all scroll positions:', error);
  }
};







