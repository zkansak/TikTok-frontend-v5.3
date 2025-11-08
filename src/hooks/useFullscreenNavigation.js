import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * 全屏模式导航 Hook
 * 管理当前视频索引、切换动画、预加载等
 */
function useFullscreenNavigation(initialIndex = 0, totalItems = 0) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const transitionTimerRef = useRef(null);
  const lastSwitchTimeRef = useRef(0); // 记录上次切换时间，防止快速连续切换
  const switchCooldownRef = useRef(400); // 切换冷却时间（毫秒），与动画时长一致

  // 立即完成过渡（用于拖拽切换）
  const completeTransition = useCallback(() => {
    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }
    setIsTransitioning(false);
  }, []);

  // 切换到下一个视频
  const goToNext = useCallback((skipCooldown = false) => {
    const now = Date.now();
    // 边界检查
    if (currentIndex >= totalItems - 1) return;
    
    // 防止连续快速切换：如果正在过渡中或冷却期内，直接返回
    // 如果是拖拽切换（skipCooldown = true），允许继续
    if (!skipCooldown) {
      if (isTransitioning) return;
      
      // 检查冷却时间：确保至少间隔 switchCooldownRef.current 毫秒才能切换
      if (now - lastSwitchTimeRef.current < switchCooldownRef.current) {
        return;
      }
    }
    
    setIsTransitioning(true);
    lastSwitchTimeRef.current = now;
    setCurrentIndex((prev) => prev + 1);
    
    // 如果是拖拽切换，立即完成过渡（无动画）
    if (skipCooldown) {
      // 使用 setTimeout 确保状态更新后再重置
      setTimeout(() => {
        completeTransition();
      }, 0);
    } else {
      // 动画完成后重置状态 - 统一使用 400ms 的动画时长
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
      }
      transitionTimerRef.current = setTimeout(() => {
        setIsTransitioning(false);
      }, 400); // 动画时长 400ms，与 CSS 动画一致
    }
  }, [currentIndex, totalItems, isTransitioning, completeTransition]);

  // 切换到上一个视频
  const goToPrevious = useCallback((skipCooldown = false) => {
    const now = Date.now();
    // 边界检查
    if (currentIndex <= 0) return;
    
    // 防止连续快速切换：如果正在过渡中或冷却期内，直接返回
    // 如果是拖拽切换（skipCooldown = true），允许继续
    if (!skipCooldown) {
      if (isTransitioning) return;
      
      // 检查冷却时间：确保至少间隔 switchCooldownRef.current 毫秒才能切换
      if (now - lastSwitchTimeRef.current < switchCooldownRef.current) {
        return;
      }
    }
    
    setIsTransitioning(true);
    lastSwitchTimeRef.current = now;
    setCurrentIndex((prev) => prev - 1);
    
    // 如果是拖拽切换，立即完成过渡（无动画）
    if (skipCooldown) {
      // 使用 setTimeout 确保状态更新后再重置
      setTimeout(() => {
        completeTransition();
      }, 0);
    } else {
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
      }
      transitionTimerRef.current = setTimeout(() => {
        setIsTransitioning(false);
      }, 400); // 动画时长 400ms，与 CSS 动画一致
    }
  }, [currentIndex, isTransitioning, completeTransition]);

  // 跳转到指定索引
  const goToIndex = useCallback((index) => {
    if (isTransitioning || index < 0 || index >= totalItems) return;
    
    setIsTransitioning(true);
    setCurrentIndex(index);
    
    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
    }
    transitionTimerRef.current = setTimeout(() => {
      setIsTransitioning(false);
    }, 350);
  }, [totalItems, isTransitioning]);

  // 当 totalItems 变化时，确保 currentIndex 不超出范围
  useEffect(() => {
    if (currentIndex >= totalItems && totalItems > 0) {
      setCurrentIndex(totalItems - 1);
    }
  }, [totalItems, currentIndex]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
      }
    };
  }, []);

  return {
    currentIndex,
    isTransitioning,
    goToNext,
    goToPrevious,
    goToIndex,
    hasNext: currentIndex < totalItems - 1,
    hasPrevious: currentIndex > 0,
  };
}

export default useFullscreenNavigation;

