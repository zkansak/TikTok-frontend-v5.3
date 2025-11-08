import { useRef, useCallback } from 'react';

/**
 * TikTok 风格滑动手势 Hook
 * 滑动过程中视频跟随，不足50%回弹，超过50%切换
 */
function useSwipeGesture(onSwipeUp, onSwipeDown, options = {}) {
  const {
    videosContainerRef, // 视频容器 ref（用于移动视频）
    onDrag, // 拖动回调（用于实时更新位置）
    swipeThreshold = 0.5, // 滑动百分比阈值（50%）
  } = options;

  const touchStartRef = useRef(null);
  const touchCurrentRef = useRef(null);
  const containerRef = useRef(null);
  const isDraggingRef = useRef(false);
  const isProcessingSwipeRef = useRef(false); // 防止重复触发切换

  // 检查是否是进度条区域的辅助函数
  const isProgressArea = useCallback((target, clientY, container) => {
    if (!container) return false;
    
    const containerRect = container.getBoundingClientRect();
    const relativeY = clientY - containerRect.top;
    const containerHeight = containerRect.height;
    
    // 检查是否在底部10%区域（进度条区域）
    const isInBottomArea = relativeY > containerHeight * 0.9;
    
    // 检查元素类名或父元素类名是否包含进度条相关的标识
    const hasProgressClass = target.closest('[class*="progress"], [class*="Progress"]') !== null ||
                             target.classList.toString().includes('progress') ||
                             target.classList.toString().includes('Progress');
    
    return isInBottomArea || hasProgressClass;
  }, []);

  const handleStart = useCallback((e) => {
    // 只处理触摸事件，不处理鼠标事件（允许文本选择）
    // 鼠标拖动只在进度条区域才处理
    if (e.type.startsWith('mouse') && e.type !== 'mousemove') {
      // 对于鼠标事件，检查是否在进度条区域
      const target = e.target;
      const container = containerRef.current;
      const clickY = e.clientY;
      
      if (!isProgressArea(target, clickY, container)) {
        // 不在进度条区域，不处理鼠标拖动，允许文本选择
        return;
      }
      // 在进度条区域，让进度条自己处理拖动
      return;
    }
    
    // 触摸事件处理
    // 检查是否点击在进度条区域
    const target = e.target;
    const container = containerRef.current;
    const clickY = e.touches?.[0]?.clientY;
    
    if (isProgressArea(target, clickY, container)) {
      touchStartRef.current = null;
      return;
    }
    
    // 阻止默认行为，开始拖动
    e.preventDefault();
    e.stopPropagation();
    
    const touch = e.touches?.[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
    touchCurrentRef.current = { ...touchStartRef.current };
    isDraggingRef.current = true;

    // 移除过渡，允许实时拖动
    if (videosContainerRef?.current) {
      videosContainerRef.current.style.transition = 'none';
    }
  }, [isProgressArea, videosContainerRef]);

  const handleMove = useCallback((e) => {
    if (!touchStartRef.current || !isDraggingRef.current) return;
    
    // 只处理触摸事件
    if (e.type.startsWith('mouse')) {
      return;
    }
    
    const swipeContainer = containerRef.current;
    if (!swipeContainer) return;
    
    // 检查是否在进度条区域拖拽
    const target = e.target;
    const touch = e.touches?.[0];
    if (!touch) return;
    const moveY = touch.clientY;
    
    if (isProgressArea(target, moveY, swipeContainer)) {
      // 如果是进度条区域，不处理滑动，重置状态
      touchStartRef.current = null;
      touchCurrentRef.current = null;
      isDraggingRef.current = false;
      return;
    }
    
    e.preventDefault();
    e.stopPropagation();
    
    // 更新当前位置
    touchCurrentRef.current = {
      x: touch.clientX,
      y: touch.clientY,
    };

    // 计算滑动距离
    // 修复方向：向下滑动（deltaY > 0）应该显示下一个视频（类似抖音）
    const deltaY = touchCurrentRef.current.y - touchStartRef.current.y;
    const containerHeight = swipeContainer.clientHeight;
    // 向下滑动（deltaY > 0）-> 显示下一个视频 -> dragPercentage < 0
    const rawDragPercentage = -deltaY / containerHeight; // 取反，修复方向

    // 简化的阻尼效果，提高流畅度
    const dampingFactor = 0.6; // 调整阻尼系数，让拖拽更流畅
    const maxDrag = 1.0;
    
    // 简单的线性阻尼，减少计算量
    let dragPercentage = Math.sign(rawDragPercentage) * 
      Math.min(Math.abs(rawDragPercentage) * dampingFactor, maxDrag);

    // 实时更新容器位置（跟随手指，带阻尼）
    if (videosContainerRef?.current && onDrag) {
      onDrag(dragPercentage);
    }
  }, [isProgressArea, videosContainerRef, onDrag]);

  const handleEnd = useCallback((e) => {
    // 只处理触摸事件
    if (e.type.startsWith('mouse')) {
      return;
    }
    
    if (!touchStartRef.current || !touchCurrentRef.current || !isDraggingRef.current) {
      return;
    }

    const deltaY = touchCurrentRef.current.y - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;
    const swipeContainer = containerRef.current;
    
    if (!swipeContainer) {
      touchStartRef.current = null;
      touchCurrentRef.current = null;
      isDraggingRef.current = false;
      return;
    }

    // 计算滑动百分比
    const containerHeight = swipeContainer.clientHeight;
    const swipePercentage = Math.abs(deltaY) / containerHeight;

    // 计算滑动速度（像素/毫秒）
    const swipeVelocity = Math.abs(deltaY) / Math.max(deltaTime, 1);

    // TikTok 风格：只根据滑动距离判断，超过50%才切换
    // 移除速度判断，防止快速滑动时跳过多个视频
    // 严格限制：只有滑动距离超过阈值才切换，速度再快也不切换
    const shouldSwipe = swipePercentage >= swipeThreshold;

    if (shouldSwipe) {
      // 防止重复触发：如果正在处理滑动，直接返回
      if (isProcessingSwipeRef.current) {
        touchStartRef.current = null;
        touchCurrentRef.current = null;
        isDraggingRef.current = false;
        return;
      }
      
      e.preventDefault();
      e.stopPropagation();
      
      // 标记正在处理滑动，防止重复触发
      isProcessingSwipeRef.current = true;
      
      // 只触发一次切换
      // 修复方向：向下滑动（deltaY > 0）-> 下一个视频
      // 向上滑动（deltaY < 0）-> 上一个视频
      if (deltaY > 0 && onSwipeUp) {
        // 向下滑动（下一个视频）
        onSwipeUp();
      } else if (deltaY < 0 && onSwipeDown) {
        // 向上滑动（上一个视频）
        onSwipeDown();
      }
      
      // 延迟重置，确保切换完成后再允许下次滑动
      setTimeout(() => {
        isProcessingSwipeRef.current = false;
        touchStartRef.current = null;
        touchCurrentRef.current = null;
        isDraggingRef.current = false;
      }, 600); // 比动画时长稍长，确保切换完成
    } else {
      // 回弹到原位置（不足50%）
      if (videosContainerRef?.current && onDrag) {
        onDrag(0, true); // 回弹
      }
      
      // 延迟重置，确保回弹动画开始后再重置状态
      setTimeout(() => {
        touchStartRef.current = null;
        touchCurrentRef.current = null;
        isDraggingRef.current = false;
      }, 50);
    }
  }, [swipeThreshold, onSwipeUp, onSwipeDown, videosContainerRef, onDrag]);

  return {
    containerRef,
    handlers: {
      // 只处理触摸事件，不处理鼠标拖动（允许文本选择）
      onTouchStart: handleStart,
      onTouchMove: handleMove,
      onTouchEnd: handleEnd,
      // 移除鼠标拖动事件，允许文本选择
    },
  };
}

export default useSwipeGesture;
