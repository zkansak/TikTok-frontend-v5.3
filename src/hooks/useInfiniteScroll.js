import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * 无限滚动 Hook
 * 使用 IntersectionObserver 监听底部元素，自动加载更多数据
 * 
 * @param {Function} fetchMore - 加载更多数据的函数，返回 Promise
 * @param {boolean} hasMore - 是否还有更多数据
 * @param {boolean} loading - 当前是否正在加载
 * @param {Object} options - 配置选项
 * @param {number} options.threshold - IntersectionObserver 的阈值，默认 0.1
 * @param {number} options.rootMargin - IntersectionObserver 的根边距，默认 '100px'
 * @param {number} options.debounceDelay - 防抖延迟（毫秒），默认 300
 * @param {number} options.maxRetries - 最大重试次数，默认 3
 * @param {number} options.retryDelay - 重试延迟（毫秒），默认 1000
 * @returns {Object} { observerRef, page, error, retry }
 */
function useInfiniteScroll(
  fetchMore,
  hasMore = true,
  loading = false,
  options = {}
) {
  const {
    threshold = 0.1,
    rootMargin = '100px',
    debounceDelay = 300,
    maxRetries = 3,
    retryDelay = 1000,
  } = options;

  const observerRef = useRef(null);
  const observerInstanceRef = useRef(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState(null);
  const retryCountRef = useRef(0);
  const debounceTimerRef = useRef(null);
  const isLoadingRef = useRef(false);
  const [element, setElement] = useState(null);

  // 防抖处理
  const debouncedFetchMore = useCallback(
    (pageNum, currentRetryCount = 0) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(async () => {
        if (isLoadingRef.current || !hasMore) {
          return;
        }

        try {
          isLoadingRef.current = true;
          setError(null);
          retryCountRef.current = currentRetryCount;
          await fetchMore(pageNum);
          setPage(pageNum);
          retryCountRef.current = 0; // 成功后重置重试次数
        } catch (err) {
          console.error('Error fetching more data:', err);
          setError(err);
          
          // 自动重试机制
          const nextRetryCount = currentRetryCount + 1;
          if (nextRetryCount <= maxRetries) {
            setTimeout(() => {
              debouncedFetchMore(pageNum, nextRetryCount);
            }, retryDelay);
          } else {
            retryCountRef.current = 0; // 达到最大重试次数后重置
          }
        } finally {
          isLoadingRef.current = false;
        }
      }, debounceDelay);
    },
    [fetchMore, hasMore, debounceDelay, maxRetries, retryDelay]
  );

  // 手动重试函数
  const retry = useCallback(() => {
    setError(null);
    retryCountRef.current = 0;
    debouncedFetchMore(page, 0);
  }, [debouncedFetchMore, page]);

  // 回调 ref，当元素被挂载时设置
  const setObserverRef = useCallback((node) => {
    if (observerRef.current) {
      // 清理旧的 observer
      if (observerInstanceRef.current) {
        observerInstanceRef.current.disconnect();
      }
    }
    
    observerRef.current = node;
    setElement(node);
  }, []);

  // 设置 IntersectionObserver
  useEffect(() => {
    if (!element || !hasMore || loading || isLoadingRef.current) {
      return;
    }

    // 清理旧的 observer
    if (observerInstanceRef.current) {
      observerInstanceRef.current.disconnect();
    }

    // 创建新的 observer
    observerInstanceRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !loading && !isLoadingRef.current) {
          const nextPage = page + 1;
          console.log('触发加载更多，页码:', nextPage); // 调试用
          debouncedFetchMore(nextPage);
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    // 开始观察
    observerInstanceRef.current.observe(element);
    console.log('IntersectionObserver 已设置，观察元素:', element); // 调试用

    // 清理函数
    return () => {
      if (observerInstanceRef.current) {
        observerInstanceRef.current.disconnect();
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [element, hasMore, loading, page, threshold, rootMargin, debouncedFetchMore]);

  // 重置状态
  const reset = useCallback(() => {
    setPage(1);
    setError(null);
    retryCountRef.current = 0;
    isLoadingRef.current = false;
  }, []);

  return {
    observerRef: setObserverRef,
    page,
    error,
    retry,
    reset,
    isLoading: isLoadingRef.current,
  };
}

export default useInfiniteScroll;

