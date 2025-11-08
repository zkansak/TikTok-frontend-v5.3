import { useEffect, useReducer, useCallback, useMemo, useRef, useState } from 'react';
import classNames from 'classnames/bind';
import PropTypes from 'prop-types';

import styles from './VideoFeed.module.scss';
import VideoItem from '~/components/VideoItem/VideoItem';
import { VideoSkeleton } from '~/components/Skeleton';
import { useInfiniteScroll } from '~/hooks';

const cx = classNames.bind(styles);

// 分页状态管理 reducer
const initialState = {
  feedList: [],
  loading: true,
  loadingMore: false,
  hasMore: true,
  error: null,
  page: 1,
  pageSize: 10,
};

function feedReducer(state, action) {
  switch (action.type) {
    case 'FETCH_START':
      return {
        ...state,
        loading: action.isInitial ? true : false,
        loadingMore: !action.isInitial,
        error: null,
      };
    case 'FETCH_SUCCESS':
      return {
        ...state,
        loading: false,
        loadingMore: false,
        feedList: action.isInitial
          ? action.data
          : [...state.feedList, ...action.data],
        hasMore: action.hasMore,
        page: action.page,
        error: null,
      };
    case 'FETCH_ERROR':
      return {
        ...state,
        loading: false,
        loadingMore: false,
        error: action.error,
      };
    case 'RESET':
      return {
        ...initialState,
        pageSize: state.pageSize,
      };
    default:
      return state;
  }
}

function VideoFeed({
  dataSource,
  transformData,
  emptyMessage = 'No content available',
  pageSize = 10,
  enableInfiniteScroll = true,
  maxItems = null, // 最大保留的 DOM 节点数量，null 表示不限制
  onVideoVisibilityChange, // 回调函数，用于通知当前可见的视频索引
  scrollToIndex, // 要滚动到的视频索引
}) {
  const [state, dispatch] = useReducer(feedReducer, {
    ...initialState,
    pageSize,
  });

  // 跟踪当前可见的视频索引（用于虚拟列表窗口计算）
  const [currentVisibleIndex, setCurrentVisibleIndex] = useState(0);

  // 加载数据的函数
  const loadData = useCallback(
    async (page = 1, isInitial = false) => {
      dispatch({ type: 'FETCH_START', isInitial });

      try {
        let result;

        // 如果 dataSource 是函数，支持分页调用
        if (typeof dataSource === 'function') {
          // 检查函数是否支持分页参数（返回对象包含 data 和 hasMore）
          const response = await dataSource(page, pageSize);

          // 如果返回的是分页格式 { data, hasMore, ... }
          if (response && typeof response === 'object' && 'data' in response) {
            result = {
              data: response.data,
              hasMore: response.hasMore !== false,
            };
          } else {
            // 如果返回的是数组，只在第一页加载
            if (page === 1) {
              result = {
                data: Array.isArray(response) ? response : [],
                hasMore: false,
              };
            } else {
              result = { data: [], hasMore: false };
            }
          }
        } else if (Array.isArray(dataSource)) {
          // 如果是数组，进行分页处理
          if (page === 1) {
            const transformed = transformData
              ? transformData(dataSource)
              : dataSource;
            const paginatedData = transformed.slice(0, pageSize);
            result = {
              data: paginatedData,
              hasMore: transformed.length > pageSize,
            };
          } else {
            const transformed = transformData
              ? transformData(dataSource)
              : dataSource;
            const startIndex = (page - 1) * pageSize;
            const endIndex = startIndex + pageSize;
            const paginatedData = transformed.slice(startIndex, endIndex);
            result = {
              data: paginatedData,
              hasMore: endIndex < transformed.length,
            };
          }
        } else {
          result = { data: [], hasMore: false };
        }

        // 应用数据转换
        const transformedData = transformData
          ? transformData(result.data)
          : result.data;

        dispatch({
          type: 'FETCH_SUCCESS',
          data: Array.isArray(transformedData) ? transformedData : [],
          hasMore: result.hasMore,
          page,
          isInitial,
        });
      } catch (error) {
        console.error('Error loading feed data:', error);
        dispatch({ type: 'FETCH_ERROR', error });
      }
    },
    [dataSource, transformData, pageSize]
  );

  // 初始加载
  useEffect(() => {
    loadData(1, true);
  }, [loadData]);

  // 无限滚动 Hook
  const fetchMore = useCallback(
    (page) => {
      return loadData(page, false);
    },
    [loadData]
  );

  const { observerRef, error: scrollError, retry } = useInfiniteScroll(
    fetchMore,
    state.hasMore && enableInfiniteScroll,
    state.loadingMore,
    {
      threshold: 0.1,
      rootMargin: '200px',
      debounceDelay: 300,
    }
  );

  // DOM 节点限制：使用双向窗口策略，保留当前可见区域附近的项目
  // 必须在所有早期返回之前调用，遵守 React Hooks 规则
  const displayedItems = useMemo(() => {
    if (!maxItems || state.feedList.length <= maxItems) {
      return state.feedList;
    }

    // 双向窗口策略：以当前可见索引为中心，保留前后各 maxItems/2 个项目
    const currentIndex = currentVisibleIndex;
    const windowSize = maxItems;
    const halfWindow = Math.floor(windowSize / 2);
    
    // 计算窗口范围
    let startIndex = Math.max(0, currentIndex - halfWindow);
    let endIndex = Math.min(state.feedList.length, startIndex + windowSize);
    
    // 如果接近末尾，调整起始位置以确保窗口大小
    if (endIndex === state.feedList.length) {
      startIndex = Math.max(0, endIndex - windowSize);
    }
    
    // 提取窗口内的项目
    const windowItems = state.feedList.slice(startIndex, endIndex);
    
    // 返回窗口项目，同时保留原始索引信息（用于后续查找）
    return windowItems.map((item, index) => ({
      ...item,
      _originalIndex: startIndex + index, // 保存原始索引
    }));
  }, [state.feedList, maxItems, currentVisibleIndex]);

  // 跟踪当前可见的视频索引
  const videoRefs = useRef(new Map());
  const currentVisibleIndexRef = useRef(0);
  const debounceTimerRef = useRef(null);

  // 防抖更新当前可见索引（避免频繁触发窗口重新计算）
  const debouncedSetCurrentVisibleIndex = useCallback((index) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      setCurrentVisibleIndex(index);
    }, 200); // 200ms 防抖延迟
  }, []);

  // 使用 IntersectionObserver 跟踪可见的视频
  useEffect(() => {
    if (!onVideoVisibilityChange || displayedItems.length === 0) return;

    const observers = new Map();
    
    // 延迟初始化，确保DOM已渲染
    const timeoutId = setTimeout(() => {
      displayedItems.forEach((item, index) => {
        const videoId = item.aweme_id || item.id || index;
        const videoElement = videoRefs.current.get(videoId);
        if (!videoElement) return;

        const observer = new IntersectionObserver(
          (intersectionEntries) => {
            intersectionEntries.forEach((entry) => {
              if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
                // 查找在完整feedList中的索引
                // 优先使用 _originalIndex（如果存在），否则使用 findIndex
                let originalIndex = item._originalIndex;
                if (originalIndex === undefined || originalIndex < 0) {
                  originalIndex = state.feedList.findIndex(
                    (feed) => 
                      (feed.aweme_id && item.aweme_id && feed.aweme_id === item.aweme_id) ||
                      (feed.id && item.id && feed.id === item.id) ||
                      (feed === item)
                  );
                }
                
                if (originalIndex >= 0) {
                  currentVisibleIndexRef.current = originalIndex;
                  debouncedSetCurrentVisibleIndex(originalIndex); // 防抖更新 state 以触发窗口重新计算
                  onVideoVisibilityChange(originalIndex);
                }
              }
            });
          },
          {
            threshold: [0, 0.25, 0.5, 0.75, 1],
            rootMargin: '-20% 0px -20% 0px', // 只有中心区域可见时才触发
          }
        );

        observer.observe(videoElement);
        observers.set(videoId, observer);
      });
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      observers.forEach((observer) => observer.disconnect());
      // 清理防抖定时器
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [displayedItems, state.feedList, onVideoVisibilityChange, debouncedSetCurrentVisibleIndex]);

  // 滚动到指定索引的视频
  useEffect(() => {
    if (scrollToIndex === null || scrollToIndex === undefined || state.feedList.length === 0) return;
    
    const targetVideo = state.feedList[scrollToIndex];
    if (!targetVideo) return;

    // 更新当前可见索引，确保窗口包含目标视频
    setCurrentVisibleIndex(scrollToIndex);
    currentVisibleIndexRef.current = scrollToIndex;

    const videoElement = videoRefs.current.get(targetVideo.aweme_id || targetVideo.id || scrollToIndex);
    if (videoElement) {
      const timeoutId = setTimeout(() => {
        videoElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // 滚动完成后，通知父组件重置 scrollToIndex
        if (onVideoVisibilityChange) {
          setTimeout(() => {
            onVideoVisibilityChange(scrollToIndex);
          }, 500); // 等待滚动动画完成
        }
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [scrollToIndex, state.feedList, onVideoVisibilityChange]);

  // 错误状态
  const displayError = state.error || scrollError;

  // 初始加载状态
  if (state.loading) {
    return (
      <div className={cx('wrapper')}>
        <div className={cx('feed-container')}>
          <VideoSkeleton count={3} />
        </div>
      </div>
    );
  }

  // 空状态
  if (state.feedList.length === 0 && !state.loading) {
    return (
      <div className={cx('wrapper')}>
        <div className={cx('empty-container')}>
          <p className={cx('empty-text')}>{emptyMessage}</p>
          {state.error && (
            <button className={cx('retry-button')} onClick={() => loadData(1, true)}>
              重试
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <main className={cx('wrapper')}>
      <div className={cx('feed-container')}>
        {/* 如果使用虚拟窗口，显示提示 */}
        {maxItems && state.feedList.length > maxItems && (
          <div className={cx('truncated-notice')}>
            <p className={cx('truncated-text')}>
              已加载 {state.feedList.length} 个视频，当前显示窗口内 {displayedItems.length} 个（优化性能）
            </p>
          </div>
        )}
        
        {displayedItems.map((feed, index) => {
          // 生成唯一 key：优先使用 _originalIndex（如果存在），否则使用 findIndex
          const originalIndex = feed._originalIndex !== undefined 
            ? feed._originalIndex 
            : state.feedList.findIndex(
                (item) => 
                  (item.aweme_id && feed.aweme_id && item.aweme_id === feed.aweme_id) ||
                  (item.id && feed.id && item.id === feed.id) ||
                  (item === feed)
              );
          
          const uniqueKey = feed.aweme_id 
            ? `${feed.aweme_id}-${originalIndex >= 0 ? originalIndex : index}` 
            : feed.id 
            ? `${feed.id}-${originalIndex >= 0 ? originalIndex : index}`
            : `feed-${originalIndex >= 0 ? originalIndex : index}`;
          
          const videoId = feed.aweme_id || feed.id || index;
          
          return (
            <div
              key={uniqueKey}
              ref={(el) => {
                if (el) {
                  videoRefs.current.set(videoId, el);
                } else {
                  videoRefs.current.delete(videoId);
                }
              }}
            >
              <VideoItem
                data={feed}
              />
            </div>
          );
        })}

        {/* 加载更多骨架屏 */}
        {state.loadingMore && <VideoSkeleton count={2} />}

        {/* 错误提示 */}
        {displayError && !state.loadingMore && (
          <div className={cx('error-container')}>
            <p className={cx('error-text')}>加载失败，请重试</p>
            <button className={cx('retry-button')} onClick={retry}>
              重试
            </button>
          </div>
        )}

        {/* 无限滚动触发器 */}
        {enableInfiniteScroll && state.hasMore && !state.loadingMore && (
          <div ref={observerRef} className={cx('scroll-trigger')}></div>
        )}

        {/* 没有更多数据提示 */}
        {!state.hasMore && state.feedList.length > 0 && (
          <div className={cx('end-container')}>
            <p className={cx('end-text')}>没有更多内容了</p>
          </div>
        )}
      </div>
    </main>
  );
}

VideoFeed.propTypes = {
  dataSource: PropTypes.oneOfType([PropTypes.func, PropTypes.array]).isRequired,
  transformData: PropTypes.func,
  emptyMessage: PropTypes.string,
  pageSize: PropTypes.number,
  enableInfiniteScroll: PropTypes.bool,
  maxItems: PropTypes.number, // 最大保留的 DOM 节点数量
  onVideoVisibilityChange: PropTypes.func, // 当前可见视频索引变化时的回调
  scrollToIndex: PropTypes.number, // 要滚动到的视频索引
};

export default VideoFeed;

