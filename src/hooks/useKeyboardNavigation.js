import { useEffect } from 'react';

/**
 * 键盘导航 Hook
 * 监听键盘上下键切换视频
 */
function useKeyboardNavigation(onArrowUp, onArrowDown, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e) => {
      // 如果用户正在输入，不触发导航
      if (
        e.target.tagName === 'INPUT' ||
        e.target.tagName === 'TEXTAREA' ||
        e.target.isContentEditable
      ) {
        return;
      }

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          if (onArrowUp) {
            onArrowUp();
          }
          break;
        case 'ArrowDown':
        case ' ': // 空格键绑定到下键
          e.preventDefault();
          if (onArrowDown) {
            onArrowDown();
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, onArrowUp, onArrowDown]);
}

export default useKeyboardNavigation;

