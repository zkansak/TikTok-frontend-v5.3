import { useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames/bind';

import styles from './VideoFullscreenView.module.scss';
import VideoItem from '~/components/VideoItem/VideoItem';
import { useFullscreenNavigation, useSwipeGesture, useKeyboardNavigation } from '~/hooks';

const cx = classNames.bind(styles);

function VideoFullscreenView({ feedList, onLoadMore, hasMore, loadingMore, initialIndex = 0, onVideoIndexChange }) {
  const totalItems = feedList.length;
  const videoContainerRef = useRef(null);
  const videosContainerRef = useRef(null);
  const isInitialMount = useRef(true);
  const baseTranslateYRef = useRef(0); // 存储当前基础位置
  const isDraggingRef = useRef(false); // 是否正在拖动
  const wheelDragRef = useRef(0); // 鼠标滚轮累积的拖动距离
  const isWheelDraggingRef = useRef(false); // 是否正在使用滚轮拖动
  const wheelDragTimerRef = useRef(null); // 滚轮拖动停止的定时器
  const currentWheelDragPercentageRef = useRef(0); // 当前滚轮拖动百分比（用于停在当前位置）
  const wheelAnimationFrameRef = useRef(null); // 滚轮拖拽的动画帧
  
  const {
    currentIndex,
    isTransitioning,
    goToNext: originalGoToNext,
    goToPrevious: originalGoToPrevious,
    goToIndex,
    hasNext,
    hasPrevious,
  } = useFullscreenNavigation(initialIndex, totalItems);
  
  // 标记是否是从拖拽切换过来的
  const isDraggingSwitchRef = useRef(false);
  
  // TikTok风格：拖拽切换无动画，键盘/按钮切换有动画
  // 关键：在调用切换前标记拖拽状态，确保切换逻辑能正确识别
  const goToNext = useCallback(() => {
    // 必须在清除状态之前标记（这是关键！）
    const wasDragging = isWheelDraggingRef.current || isDraggingRef.current;
    isDraggingSwitchRef.current = wasDragging;
    
    // 清除所有拖拽相关的状态和定时器
    wheelDragRef.current = 0;
    currentWheelDragPercentageRef.current = 0;
    isWheelDraggingRef.current = false;
    isDraggingRef.current = false;
    
    if (wheelDragTimerRef.current) {
      clearTimeout(wheelDragTimerRef.current);
      wheelDragTimerRef.current = null;
    }
    
    // 取消所有正在进行的动画帧
    if (wheelAnimationFrameRef.current) {
      cancelAnimationFrame(wheelAnimationFrameRef.current);
      wheelAnimationFrameRef.current = null;
    }
    
    if (dragAnimationFrameRef.current) {
      cancelAnimationFrame(dragAnimationFrameRef.current);
      dragAnimationFrameRef.current = null;
    }
    
    // 如果是从拖拽切换，立即清除所有过渡效果（在切换前）
    if (wasDragging && videosContainerRef.current) {
      const container = videosContainerRef.current;
      container.style.setProperty('transition', 'none', 'important');
      container.style.transition = 'none';
    }
    
    // 调用切换：拖拽切换时跳过冷却时间，立即完成过渡
    originalGoToNext(wasDragging);
  }, [originalGoToNext]);
  
  const goToPrevious = useCallback(() => {
    // 必须在清除状态之前标记（这是关键！）
    const wasDragging = isWheelDraggingRef.current || isDraggingRef.current;
    isDraggingSwitchRef.current = wasDragging;
    
    // 清除所有拖拽相关的状态和定时器
    wheelDragRef.current = 0;
    currentWheelDragPercentageRef.current = 0;
    isWheelDraggingRef.current = false;
    isDraggingRef.current = false;
    
    if (wheelDragTimerRef.current) {
      clearTimeout(wheelDragTimerRef.current);
      wheelDragTimerRef.current = null;
    }
    
    // 取消所有正在进行的动画帧
    if (wheelAnimationFrameRef.current) {
      cancelAnimationFrame(wheelAnimationFrameRef.current);
      wheelAnimationFrameRef.current = null;
    }
    
    if (dragAnimationFrameRef.current) {
      cancelAnimationFrame(dragAnimationFrameRef.current);
      dragAnimationFrameRef.current = null;
    }
    
    // 如果是从拖拽切换，立即清除所有过渡效果（在切换前）
    if (wasDragging && videosContainerRef.current) {
      const container = videosContainerRef.current;
      container.style.setProperty('transition', 'none', 'important');
      container.style.transition = 'none';
    }
    
    // 调用切换：拖拽切换时跳过冷却时间，立即完成过渡
    originalGoToPrevious(wasDragging);
  }, [originalGoToPrevious]);

  // 当 initialIndex 变化时，跳转到指定索引
  useEffect(() => {
    if (initialIndex >= 0 && initialIndex < totalItems && initialIndex !== currentIndex) {
      goToIndex(initialIndex);
    }
  }, [initialIndex, totalItems, goToIndex, currentIndex]);

  // 通知父组件当前视频索引变化
  useEffect(() => {
    if (onVideoIndexChange) {
      onVideoIndexChange(currentIndex);
    }
  }, [currentIndex, onVideoIndexChange]);

  // 使用 requestAnimationFrame 优化拖拽流畅度
  const dragAnimationFrameRef = useRef(null);
  
  // TikTok 风格拖动处理：实时更新容器位置（优化版本，减少卡顿）
  // 拖动时视频跟随，切换时两个视频同时可见
  const handleDrag = useCallback((dragPercentage, isRebound = false) => {
    if (!videosContainerRef.current) return;

    const container = videosContainerRef.current;
    const baseTranslateY = baseTranslateYRef.current;
    
    if (isRebound) {
      // 取消正在进行的动画帧
      if (dragAnimationFrameRef.current) {
        cancelAnimationFrame(dragAnimationFrameRef.current);
        dragAnimationFrameRef.current = null;
      }
      
      // 回弹：使用弹性动画回到原位置
      isDraggingRef.current = false;
      container.style.transition = 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
      container.style.transform = `translateY(${baseTranslateY}%)`;
      
      // 重置视频状态为正常状态
      const prevIdx = currentIndex > 0 ? currentIndex - 1 : null;
      const nextIdx = currentIndex < totalItems - 1 ? currentIndex + 1 : null;
      setVideoStates((prevStates) => {
        const newStates = { ...prevStates };
        if (prevIdx !== null) newStates[prevIdx] = 'prev';
        newStates[currentIndex] = 'current';
        if (nextIdx !== null) newStates[nextIdx] = 'next';
        return newStates;
      });
    } else {
      // 拖动中：使用 requestAnimationFrame 优化性能
      isDraggingRef.current = true;
      
      // 取消之前的动画帧
      if (dragAnimationFrameRef.current) {
        cancelAnimationFrame(dragAnimationFrameRef.current);
      }
      
      // 使用 requestAnimationFrame 确保流畅更新
      dragAnimationFrameRef.current = requestAnimationFrame(() => {
        const currentTranslateY = baseTranslateY + (dragPercentage * 100);
        container.style.transition = 'none';
        container.style.transform = `translateY(${currentTranslateY}%)`;
        dragAnimationFrameRef.current = null;
      });
      
      // 移除拖动时的视频状态更新，减少卡顿
      // 只在回弹或切换时才更新状态
    }
  }, [currentIndex, totalItems]);
  
  // 滑动手势处理 - 标记拖拽切换
  const handleSwipeUp = useCallback(() => {
    isDraggingSwitchRef.current = isDraggingRef.current;
    goToNext();
  }, [goToNext]);
  
  const handleSwipeDown = useCallback(() => {
    isDraggingSwitchRef.current = isDraggingRef.current;
    goToPrevious();
  }, [goToPrevious]);

  // 滑动手势 - TikTok 风格：滑动过程中视频跟随，不足50%回弹，超过50%切换
  const { containerRef, handlers } = useSwipeGesture(
    handleSwipeUp, // 向上滑动 -> 下一个
    handleSwipeDown, // 向下滑动 -> 上一个
    {
      videosContainerRef, // 传递视频容器 ref
      onDrag: handleDrag, // 拖动回调
      swipeThreshold: 0.5, // 50% 阈值
    }
  );

  // 键盘导航
  useKeyboardNavigation(goToPrevious, goToNext, true);

  // 当接近底部时，加载更多
  useEffect(() => {
    if (hasMore && !loadingMore && currentIndex >= totalItems - 2) {
      onLoadMore?.();
    }
  }, [currentIndex, totalItems, hasMore, loadingMore, onLoadMore]);

  // 处理上下箭头点击
  const handleArrowUp = useCallback(() => {
    if (hasPrevious) {
      goToPrevious();
    }
  }, [hasPrevious, goToPrevious]);

  const handleArrowDown = useCallback(() => {
    if (hasNext) {
      goToNext();
    }
  }, [hasNext, goToNext]);

  // 鼠标滚轮拖拽效果：优化的实时拖拽，使用 requestAnimationFrame
  // 分离滑动拖拽和键盘/按钮切换，滑动拖拽不需要多余的效果
  // 注意：必须使用非 passive 事件监听器才能调用 preventDefault
  const handleWheel = useCallback((e) => {
    // 检查容器是否存在
    const container = videosContainerRef.current;
    const containerElement = containerRef.current;
    if (!container || !containerElement) return;
    
    // 确保容器有焦点（这对于快速滑动很重要，避免失去焦点导致事件不响应）
    // 使用 document.activeElement 检查，如果容器不是活动元素，立即聚焦
    if (document.activeElement !== containerElement) {
      containerElement.focus({ preventScroll: true });
    }
    
    // 检查容器是否可见且在视口中
    const containerRect = containerElement.getBoundingClientRect();
    const isContainerVisible = containerRect.width > 0 && containerRect.height > 0;
    const isContainerInViewport = containerRect.top < window.innerHeight && 
                                   containerRect.bottom > 0 &&
                                   containerRect.left < window.innerWidth && 
                                   containerRect.right > 0;
    
    // 如果容器不可见或不在视口中，不处理
    if (!isContainerVisible || !isContainerInViewport) {
      return;
    }
    
    // 检查是否在进度条区域（优先检查，如果在进度条区域，不处理）
    const target = e.target;
    const hasProgressClass = target.closest('[class*="progress"], [class*="Progress"]') !== null ||
                             target.classList.toString().includes('progress') ||
                             target.classList.toString().includes('Progress');
    if (hasProgressClass) {
      return; // 在进度条区域，不处理
    }
    
    // 检查鼠标位置（如果可用），避免在 header 或 sidebar 区域处理
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    if (mouseX !== undefined && mouseY !== undefined) {
      const headerHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--default-layout-header-height')) || 60;
      if (mouseY < headerHeight) {
        return;
      }
      
      const sidebarWidth = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--default-layout-sidebar-width')) || 240;
      if (mouseX < sidebarWidth) {
        return;
      }
    }
    
    // 处理滚轮拖动（简化逻辑：只要容器可见就处理）
    e.preventDefault();
    e.stopPropagation();
    
    // 无论是否在过渡中，都允许处理滚轮拖动
    // 先标记为拖拽状态，这样即使 isTransitioning 为 true，也能继续处理
    const wasDraggingBefore = isWheelDraggingRef.current;
    if (!wasDraggingBefore) {
      // 第一次滚动：初始化拖动状态，并清理之前可能残留的状态
      wheelDragRef.current = 0;
      currentWheelDragPercentageRef.current = 0;
      isWheelDraggingRef.current = true;
      isDraggingRef.current = false; // 确保触摸拖拽状态被清除
      
      // 清除之前可能残留的定时器和动画帧
      if (wheelDragTimerRef.current) {
        clearTimeout(wheelDragTimerRef.current);
        wheelDragTimerRef.current = null;
      }
      if (wheelAnimationFrameRef.current) {
        cancelAnimationFrame(wheelAnimationFrameRef.current);
        wheelAnimationFrameRef.current = null;
      }
      if (dragAnimationFrameRef.current) {
        cancelAnimationFrame(dragAnimationFrameRef.current);
        dragAnimationFrameRef.current = null;
      }
    }
    
    // 如果正在过渡中，且之前没有在拖拽，允许继续（因为我们已经设置了拖拽状态）
    // 这样用户可以在过渡期间开始新的拖拽
    
    const containerHeight = container.parentElement?.clientHeight || window.innerHeight;
    
    // 累积滚轮距离
    // 向下滚动（deltaY > 0）-> 下一个视频（dragPercentage < 0）
    const deltaY = e.deltaY;
    wheelDragRef.current += deltaY;
    
    // 清除之前的定时器
    if (wheelDragTimerRef.current) {
      clearTimeout(wheelDragTimerRef.current);
      wheelDragTimerRef.current = null;
    }
    
    // 简单的阻尼计算：向下滚动显示下一个视频
    const rawDragPercentage = -wheelDragRef.current / containerHeight;
    const dampingFactor = 0.6; // 调整阻尼系数，让拖拽更流畅
    const maxDrag = 1.0;
    
    // 简单的阻尼效果
    let dragPercentage = Math.sign(rawDragPercentage) * 
      Math.min(Math.abs(rawDragPercentage) * dampingFactor, maxDrag);
    
    // 保存当前拖动百分比
    currentWheelDragPercentageRef.current = dragPercentage;
    
    // 使用 requestAnimationFrame 优化性能，确保流畅
    if (wheelAnimationFrameRef.current) {
      cancelAnimationFrame(wheelAnimationFrameRef.current);
    }
    
    wheelAnimationFrameRef.current = requestAnimationFrame(() => {
      const baseTranslateY = baseTranslateYRef.current;
      const currentTranslateY = baseTranslateY + (dragPercentage * 100);
      container.style.transition = 'none';
      container.style.transform = `translateY(${currentTranslateY}%)`;
      wheelAnimationFrameRef.current = null;
    });
    
    // 设置定时器：停止滚动后判断是否切换或回弹
    // TikTok风格：停止滚动后，从当前位置平滑过渡到目标位置
    wheelDragTimerRef.current = setTimeout(() => {
      // 只有在停止拖动时才判断
      if (!isWheelDraggingRef.current) {
        wheelDragTimerRef.current = null;
        return;
      }
      
      const finalDragPercentage = currentWheelDragPercentageRef.current;
      const absFinalDrag = Math.abs(finalDragPercentage);
      const shouldSwipe = absFinalDrag >= 0.5;
      
      if (shouldSwipe) {
        // 切换视频：超过50%
        // 注意：不要在这里清除 isWheelDraggingRef.current，让 goToNext/goToPrevious 来处理
        if (finalDragPercentage < 0 && hasNext) {
          // 向下滚动 -> 下一个视频
          goToNext();
        } else if (finalDragPercentage > 0 && hasPrevious) {
          // 向上滚动 -> 上一个视频
          goToPrevious();
        } else {
          // 无法切换，回弹并重置所有状态
          isWheelDraggingRef.current = false;
          isDraggingRef.current = false;
          container.style.transition = 'transform 0.3s ease-out';
          container.style.transform = `translateY(${baseTranslateYRef.current}%)`;
          wheelDragRef.current = 0;
          currentWheelDragPercentageRef.current = 0;
        }
      } else {
        // 回弹到原位置并重置所有状态
        isWheelDraggingRef.current = false;
        isDraggingRef.current = false;
        container.style.transition = 'transform 0.3s ease-out';
        container.style.transform = `translateY(${baseTranslateYRef.current}%)`;
        wheelDragRef.current = 0;
        currentWheelDragPercentageRef.current = 0;
      }
      
      wheelDragTimerRef.current = null;
    }, 200); // 200ms 后判断（给用户时间停止滚动）
  }, [hasNext, hasPrevious, goToNext, goToPrevious, isTransitioning]);
  
  // 使用 ref 存储 handleWheel，避免因为依赖变化导致事件监听器被移除
  const handleWheelRef = useRef(handleWheel);
  useEffect(() => {
    handleWheelRef.current = handleWheel;
  }, [handleWheel]);

  // 手动添加 wheel 事件监听器（非 passive，允许 preventDefault）
  // 同时绑定到 document 和容器元素，确保触控板滚动时也能捕获到事件
  // 使用稳定的包装函数，避免因为 handleWheel 依赖变化导致事件监听器被移除
  useEffect(() => {
    const stableHandleWheel = (e) => {
      // 检查容器是否存在
      const containerElement = containerRef.current;
      if (!containerElement) return;
      
      // 在调用处理函数之前，立即强制聚焦容器（鼠标活动后立即聚焦）
      // 滚轮滑动也是鼠标活动的一种，应该立即聚焦
      // 不检查 document.activeElement，直接聚焦，确保快速响应
      containerElement.focus({ preventScroll: true });
      
      // 调用处理函数
      handleWheelRef.current(e);
    };

    // 绑定到 document 上（全局捕获）
    document.addEventListener('wheel', stableHandleWheel, { passive: false, capture: true });

    // 延迟绑定到容器元素，确保容器已挂载
    const timeoutId = setTimeout(() => {
      const containerElement = containerRef.current;
      if (containerElement) {
        containerElement.addEventListener('wheel', stableHandleWheel, { passive: false });
      }
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('wheel', stableHandleWheel, { capture: true });
      const containerElement = containerRef.current;
      if (containerElement) {
        containerElement.removeEventListener('wheel', stableHandleWheel);
      }
    };
  }, []); // 空依赖数组，确保事件监听器只添加一次

  // 添加鼠标活动事件（包括鼠标移动和滚轮），确保容器在鼠标活动后立即获得焦点
  // 这对于触控板滚动很重要，因为某些浏览器需要鼠标在元素上才能处理滚动事件
  useEffect(() => {
    let containerElement = null;
    let cleanup = null;

    // 立即聚焦容器的函数（在鼠标活动后调用）
    // 不检查当前焦点状态，直接强制聚焦，确保快速响应
    const focusContainer = () => {
      if (containerElement) {
        containerElement.focus({ preventScroll: true });
      }
    };

    // 延迟绑定，确保容器已挂载
    const timeoutId = setTimeout(() => {
      containerElement = containerRef.current;
      if (!containerElement) return;

      const handleMouseEnter = () => {
        // 鼠标进入容器时，立即聚焦容器
        focusContainer();
      };

      const handleMouseMove = (e) => {
        // 鼠标移动时，如果鼠标在容器区域内，立即聚焦容器
        // 不检查是否已有焦点，直接聚焦，确保快速响应
        if (!containerElement) return;
        
        const rect = containerElement.getBoundingClientRect();
        const isInsideContainer = 
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom;
        
        // 如果鼠标在容器内，立即聚焦（不检查当前焦点状态）
        if (isInsideContainer) {
          focusContainer();
        }
      };

      // 绑定到容器元素
      containerElement.addEventListener('mouseenter', handleMouseEnter);
      containerElement.addEventListener('mousemove', handleMouseMove);
      
      // 同时绑定全局鼠标移动事件，确保即使鼠标快速移动也能捕获到
      // 这对于快速滑动很重要
      document.addEventListener('mousemove', handleMouseMove, { passive: true });
      
      // 绑定鼠标按下事件，确保点击时也能聚焦
      const handleMouseDown = () => {
        focusContainer();
      };
      containerElement.addEventListener('mousedown', handleMouseDown);
      document.addEventListener('mousedown', handleMouseDown, { passive: true });

      cleanup = () => {
        if (containerElement) {
          containerElement.removeEventListener('mouseenter', handleMouseEnter);
          containerElement.removeEventListener('mousemove', handleMouseMove);
          containerElement.removeEventListener('mousedown', handleMouseDown);
        }
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mousedown', handleMouseDown);
      };
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      if (cleanup) {
        cleanup();
      }
    };
  }, []);

  // 监听鼠标释放事件，用于滚轮拖拽
  useEffect(() => {
    const handleMouseUp = () => {
      if (isWheelDraggingRef.current && videosContainerRef.current) {
        const container = videosContainerRef.current;
        const baseTranslateY = baseTranslateYRef.current;
        const finalDragPercentage = currentWheelDragPercentageRef.current;
        const absFinalDrag = Math.abs(finalDragPercentage);
        const shouldSwipe = absFinalDrag >= 0.5;
        
        // 清除定时器
        if (wheelDragTimerRef.current) {
          clearTimeout(wheelDragTimerRef.current);
          wheelDragTimerRef.current = null;
        }
        
        if (shouldSwipe) {
          // 切换视频：超过50%
          // 注意：不要在这里清除 isWheelDraggingRef.current，让 goToNext/goToPrevious 来处理
          if (finalDragPercentage < 0 && hasNext) {
            goToNext();
          } else if (finalDragPercentage > 0 && hasPrevious) {
            goToPrevious();
          } else {
            // 无法切换，回弹并重置所有状态
            isWheelDraggingRef.current = false;
            isDraggingRef.current = false;
            container.style.transition = 'transform 0.3s ease-out';
            container.style.transform = `translateY(${baseTranslateY}%)`;
            wheelDragRef.current = 0;
            currentWheelDragPercentageRef.current = 0;
          }
        } else {
          // 回弹到原位置并重置所有状态
          isWheelDraggingRef.current = false;
          isDraggingRef.current = false;
          container.style.transition = 'transform 0.3s ease-out';
          container.style.transform = `translateY(${baseTranslateY}%)`;
          wheelDragRef.current = 0;
          currentWheelDragPercentageRef.current = 0;
        }
      }
    };
    
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [hasNext, hasPrevious, goToNext, goToPrevious]);

  // TikTok 风格布局：渲染上一个、当前、下一个三个视频
  // 每个视频占 100% 高度，切换时两个视频同时可见（退出和进入）
  const prevIndex = currentIndex > 0 ? currentIndex - 1 : null;
  const nextIndex = currentIndex < totalItems - 1 ? currentIndex + 1 : null;
  
  // 计算基础位置（当前视频应该显示的位置）
  // 容器中包含三个视频：0%（上一个）、100%（当前）、200%（下一个）
  // 当前视频在第二个位置（100%），容器向上移动 100% 来显示它
  const hasPrev = prevIndex !== null;
  const baseTranslateY = hasPrev ? -100 : 0;
  baseTranslateYRef.current = baseTranslateY; // 更新 ref，供 handleDrag 使用
  
  // 管理每个视频的动画状态（用于淡入淡出效果）
  const [videoStates, setVideoStates] = useState(() => {
    const states = {};
    if (prevIndex !== null) states[prevIndex] = 'prev';
    states[currentIndex] = 'current';
    if (nextIndex !== null) states[nextIndex] = 'next';
    return states;
  });
  
  // 当索引变化时，初始化新视频的状态
  useEffect(() => {
    if (!isInitialMount.current) {
      const newPrevIndex = currentIndex > 0 ? currentIndex - 1 : null;
      const newNextIndex = currentIndex < totalItems - 1 ? currentIndex + 1 : null;
      setVideoStates((prevStates) => {
        const newStates = { ...prevStates };
        if (newPrevIndex !== null) newStates[newPrevIndex] = 'prev';
        if (!newStates[currentIndex] || newStates[currentIndex] === 'entering-from-bottom' || newStates[currentIndex] === 'entering-from-top') {
          // 保持进入状态，稍后会更新为 current
        } else {
          newStates[currentIndex] = 'current';
        }
        if (newNextIndex !== null) newStates[newNextIndex] = 'next';
        return newStates;
      });
    }
  }, [currentIndex, totalItems, isInitialMount]);
  
  // 切换动画：通过移动容器实现
  // TikTok 风格：容器中包含三个视频（上一个、当前、下一个），垂直排列
  // 它们在容器中的位置：0%（上一个）、100%（当前）、200%（下一个）
  // 切换时：旧视频退出和新视频进入同时进行，两个视频同时可见
  const previousIndexRef = useRef(currentIndex);
  const previousBaseTranslateYRef = useRef(baseTranslateY);
  
  useEffect(() => {
    if (videosContainerRef.current) {
      const container = videosContainerRef.current;
      const prevIndex = previousIndexRef.current;
      const indexChanged = prevIndex !== currentIndex;
      const prevBaseTranslateY = previousBaseTranslateYRef.current;
      const baseTranslateYChanged = prevBaseTranslateY !== baseTranslateY;
      
      if (isInitialMount.current) {
        // 初始加载：直接设置位置，无需动画
        container.style.transition = 'none';
        container.style.transform = `translateY(${baseTranslateY}%)`;
        isInitialMount.current = false;
        previousIndexRef.current = currentIndex;
        previousBaseTranslateYRef.current = baseTranslateY;
        return;
      }
      
      // 如果正在拖动（触摸拖动或滚轮拖动），不处理切换动画
      if (isDraggingRef.current || isWheelDraggingRef.current) {
        previousIndexRef.current = currentIndex;
        previousBaseTranslateYRef.current = baseTranslateY;
        return;
      }
      
      // 切换视频时：需要重新计算容器位置
      if (indexChanged) {
        // 检查是否是从拖拽切换过来的
        const wasDragging = isDraggingSwitchRef.current;
        isDraggingSwitchRef.current = false; // 重置标记
        
        // 取消所有正在进行的动画帧和定时器
        if (wheelAnimationFrameRef.current) {
          cancelAnimationFrame(wheelAnimationFrameRef.current);
          wheelAnimationFrameRef.current = null;
        }
        
        if (dragAnimationFrameRef.current) {
          cancelAnimationFrame(dragAnimationFrameRef.current);
          dragAnimationFrameRef.current = null;
        }
        
        // 获取容器当前位置
        // 对于键盘/按钮切换，使用prevBaseTranslateY作为起始位置（更准确）
        // 对于拖拽切换，需要从transform中提取当前拖拽位置
        const currentTransform = container.style.transform;
        let currentTranslateY = prevBaseTranslateY;
        
        // 如果是拖拽切换，尝试从当前 transform 中提取 translateY 值
        // 注意：wasDragging 在 isDraggingSwitchRef.current 被设置为 true 之后才会被检查
        if (wasDragging && currentTransform && currentTransform.includes('translateY')) {
          const match = currentTransform.match(/translateY\(([^)]+)\)/);
          if (match) {
            const value = match[1];
            if (value.includes('%')) {
              currentTranslateY = parseFloat(value);
            }
          }
        }
        
        if (wasDragging) {
          // 拖拽切换：直接从拖拽位置立即设置到新位置，无过渡动画
          // 这样所有拖拽切换（包括1-2、2-1）都使用相同的逻辑
          
          // 立即清除过渡效果并设置到新位置
          container.style.transition = 'none';
          container.style.transform = `translateY(${baseTranslateY}%)`;
          
          // 同步更新视频状态
          setVideoStates((prevStates) => {
            const newStates = { ...prevStates };
            const newPrevIndex = currentIndex > 0 ? currentIndex - 1 : null;
            const newNextIndex = currentIndex < totalItems - 1 ? currentIndex + 1 : null;
            if (newPrevIndex !== null) newStates[newPrevIndex] = 'prev';
            newStates[currentIndex] = 'current';
            if (newNextIndex !== null) newStates[newNextIndex] = 'next';
            // 清理旧视频状态
            Object.keys(newStates).forEach((key) => {
              const idx = parseInt(key);
              if (idx !== currentIndex && idx !== newPrevIndex && idx !== newNextIndex) {
                delete newStates[key];
              }
            });
            return newStates;
          });
          
          // 立即重置所有拖拽状态（同步重置，确保下次滚轮事件可以立即响应）
          isWheelDraggingRef.current = false;
          isDraggingRef.current = false;
          wheelDragRef.current = 0;
          currentWheelDragPercentageRef.current = 0;
          
          // 清除所有定时器和动画帧
          if (wheelDragTimerRef.current) {
            clearTimeout(wheelDragTimerRef.current);
            wheelDragTimerRef.current = null;
          }
          if (wheelAnimationFrameRef.current) {
            cancelAnimationFrame(wheelAnimationFrameRef.current);
            wheelAnimationFrameRef.current = null;
          }
          if (dragAnimationFrameRef.current) {
            cancelAnimationFrame(dragAnimationFrameRef.current);
            dragAnimationFrameRef.current = null;
          }
          
          // 立即同步聚焦容器（不使用 requestAnimationFrame，确保立即生效）
          // 这对于快速滑动很重要，避免第一次滚轮事件被忽略
          const containerElement = containerRef.current;
          if (containerElement) {
            containerElement.focus({ preventScroll: true });
          }
          
          // 更新 ref
          previousIndexRef.current = currentIndex;
          previousBaseTranslateYRef.current = baseTranslateY;
        } else {
          // 键盘/按钮切换：平滑过渡动画
          // 使用prevBaseTranslateY作为起始位置，确保1-2和2-1切换动画一致
          const startTranslateY = prevBaseTranslateY;
          
          // 更新视频状态（触发淡入淡出动画）
          setVideoStates((prevStates) => {
            const newStates = { ...prevStates };
            // 旧视频淡出
            if (prevIndex !== null && prevStates[prevIndex]) {
              newStates[prevIndex] = 'exiting-up';
            }
            // 新视频淡入
            const newPrevIndex = currentIndex > 0 ? currentIndex - 1 : null;
            const newNextIndex = currentIndex < totalItems - 1 ? currentIndex + 1 : null;
            if (newPrevIndex !== null) newStates[newPrevIndex] = 'prev';
            newStates[currentIndex] = 'entering-from-bottom';
            if (newNextIndex !== null) newStates[newNextIndex] = 'next';
            return newStates;
          });
          
          // 确保起始位置正确：先设置到起始位置（无过渡）
          container.style.transition = 'none';
          container.style.transform = `translateY(${startTranslateY}%)`;
          
          // 使用双 requestAnimationFrame 确保浏览器已经应用了起始位置
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              if (container) {
                // 更新 ref（在动画开始前更新）
                previousIndexRef.current = currentIndex;
                previousBaseTranslateYRef.current = baseTranslateY;
                
                // 应用平滑动画到目标位置
                container.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)';
                container.style.transform = `translateY(${baseTranslateY}%)`;
                
                // 动画完成后，更新视频状态为正常状态
                setTimeout(() => {
                  setVideoStates((prevStates) => {
                    const newStates = { ...prevStates };
                    const newPrevIndex = currentIndex > 0 ? currentIndex - 1 : null;
                    const newNextIndex = currentIndex < totalItems - 1 ? currentIndex + 1 : null;
                    if (newPrevIndex !== null) newStates[newPrevIndex] = 'prev';
                    newStates[currentIndex] = 'current';
                    if (newNextIndex !== null) newStates[newNextIndex] = 'next';
                    // 清理旧视频状态
                    Object.keys(newStates).forEach((key) => {
                      const idx = parseInt(key);
                      if (idx !== currentIndex && idx !== newPrevIndex && idx !== newNextIndex) {
                        delete newStates[key];
                      }
                    });
                    return newStates;
                  });
                  
                  // 确保容器重新获得焦点，以便下次滚轮事件可以立即响应
                  const containerElement = containerRef.current;
                  if (containerElement) {
                    containerElement.focus({ preventScroll: true });
                  }
                }, 400);
              }
            });
          });
        }
      } else if (baseTranslateYChanged && !isTransitioning) {
        // 基础位置变化但索引没变（比如第一个视频变成有上一个视频的情况）
        previousBaseTranslateYRef.current = baseTranslateY;
        container.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)';
        container.style.transform = `translateY(${baseTranslateY}%)`;
      }
    }
  }, [currentIndex, baseTranslateY, isTransitioning, totalItems]);

  // 组件挂载时，确保容器可以获得焦点（这对于触控板滚动很重要）
  // 注意：必须在早期返回之前调用，遵守 React Hooks 规则
  useEffect(() => {
    const containerElement = containerRef.current;
    if (containerElement) {
      // 添加 tabIndex 让容器可以获得焦点
      containerElement.setAttribute('tabIndex', '-1');
      // 尝试聚焦容器（不显示焦点轮廓）
      containerElement.focus({ preventScroll: true });
    }
  }, []);
  
  // 每当 currentIndex 变化时，确保容器重新获得焦点
  // 这对于快速连续滑动很重要
  useEffect(() => {
    // 使用 requestAnimationFrame 确保在 DOM 更新后执行
    requestAnimationFrame(() => {
      const containerElement = containerRef.current;
      if (containerElement) {
        // 如果容器没有焦点，立即聚焦
        if (document.activeElement !== containerElement) {
          containerElement.focus({ preventScroll: true });
        }
      }
    });
  }, [currentIndex]);

  // 当前视频数据
  const currentVideo = feedList[currentIndex];

  if (!currentVideo) {
    return (
      <div className={cx('wrapper')}>
        <div className={cx('empty-container')}>
          <p className={cx('empty-text')}>No videos available</p>
        </div>
      </div>
    );
  }

  // TikTok 风格：渲染上一个、当前、下一个三个视频
  // 切换时两个视频同时可见（退出和进入）
  const videosToRender = [];
  if (prevIndex !== null && feedList[prevIndex]) {
    videosToRender.push({ index: prevIndex, data: feedList[prevIndex] });
  }
  videosToRender.push({ index: currentIndex, data: currentVideo });
  if (nextIndex !== null && feedList[nextIndex]) {
    videosToRender.push({ index: nextIndex, data: feedList[nextIndex] });
  }

  return (
    <div
      className={cx('wrapper')}
      ref={containerRef}
      {...handlers}
      tabIndex={-1}
      style={{ outline: 'none' }}
      onMouseEnter={() => {
        // 鼠标进入时，确保容器处于活跃状态
        const containerElement = containerRef.current;
        if (containerElement) {
          containerElement.focus({ preventScroll: true });
        }
      }}
    >
      <div 
        ref={videoContainerRef}
        className={cx('video-container')}
      >
        {/* TikTok 风格：单个容器包含所有视频，通过 transform 移动 */}
        <div 
          ref={videosContainerRef}
          className={cx('videos-container')}
        >
          {videosToRender.map(({ index, data }) => {
            const videoState = videoStates[index] || (index === currentIndex ? 'current' : index < currentIndex ? 'prev' : 'next');
            return (
              <div 
                key={`video-${data?.aweme_id || data?.id || index}`}
                className={cx('video-item-wrapper', {
                  'video-entering-from-bottom': videoState === 'entering-from-bottom',
                  'video-entering-from-top': videoState === 'entering-from-top',
                  'video-exiting-up': videoState === 'exiting-up',
                  'video-exiting-down': videoState === 'exiting-down',
                  'video-current': videoState === 'current',
                })}
              >
                <VideoItem data={data} isFullscreen={true} />
              </div>
            );
          })}
        </div>
      </div>

      {/* 上下箭头 */}
      <div className={cx('navigation-arrows')}>
        <button
          className={cx('arrow-button', 'arrow-up', { disabled: !hasPrevious })}
          onClick={handleArrowUp}
          aria-label="Previous video"
          disabled={!hasPrevious}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z" />
          </svg>
        </button>
        <button
          className={cx('arrow-button', 'arrow-down', { disabled: !hasNext })}
          onClick={handleArrowDown}
          aria-label="Next video"
          disabled={!hasNext}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z" />
          </svg>
        </button>
      </div>

      {/* 加载更多指示器 */}
      {loadingMore && (
        <div className={cx('loading-indicator')}>
          <div className={cx('spinner')}></div>
        </div>
      )}
    </div>
  );
}

VideoFullscreenView.propTypes = {
  feedList: PropTypes.array.isRequired,
  onLoadMore: PropTypes.func,
  hasMore: PropTypes.bool,
  loadingMore: PropTypes.bool,
  initialIndex: PropTypes.number, // 初始视频索引
  onVideoIndexChange: PropTypes.func, // 视频索引变化时的回调
};

export default VideoFullscreenView;

