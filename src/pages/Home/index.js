import { useState, useCallback, useEffect, useRef } from 'react';
import classNames from 'classnames/bind';

import VideoFeed from '~/components/VideoFeed';
import VideoFullscreenView from '~/components/VideoFullscreenView';
import { getFeedPaginated } from '~/services/feedService';
import { transformVideoList } from '~/utils/dataTransform';
import styles from './Home.module.scss';

const cx = classNames.bind(styles);

// 模式类型
const VIEW_MODE = {
  LIST: 'list',
  FULLSCREEN: 'fullscreen',
};

function Home() {
  const [viewMode, setViewMode] = useState(VIEW_MODE.LIST);
  const [feedList, setFeedList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0); // 当前可见的视频索引
  const [scrollToIndex, setScrollToIndex] = useState(null); // 要滚动到的视频索引
  const previousViewModeRef = useRef(VIEW_MODE.LIST);

  // 数据源：使用分页 API
  const dataSource = useCallback(async (pageNum = 1, pageSize = 10) => {
    // 使用分页服务获取数据
    const result = await getFeedPaginated(pageNum, pageSize);
    return {
      data: result.data,
      hasMore: result.hasMore,
      total: result.total,
    };
  }, []);

  // 数据转换函数
  const transformData = useCallback((data) => {
    return transformVideoList(data);
  }, []);

  // 加载数据
  const loadData = useCallback(
    async (pageNum = 1, isInitial = false) => {
      if (isInitial) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const result = await dataSource(pageNum, 10);
        const transformedData = transformData(result.data);

        if (isInitial) {
          setFeedList(transformedData);
        } else {
          setFeedList((prev) => [...prev, ...transformedData]);
        }

        setHasMore(result.hasMore);
        setPage(pageNum);
      } catch (error) {
        console.error('Error loading feed data:', error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [dataSource, transformData]
  );

  // 初始加载
  useEffect(() => {
    loadData(1, true);
  }, [loadData]);

  // 加载更多（用于全屏模式）
  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      loadData(page + 1, false);
    }
  }, [loadData, page, loadingMore, hasMore]);

  // 切换模式
  const toggleViewMode = useCallback(() => {
    setViewMode((prev) => {
      const newMode = prev === VIEW_MODE.LIST ? VIEW_MODE.FULLSCREEN : VIEW_MODE.LIST;
      previousViewModeRef.current = prev;
      
      // 如果从列表模式切换到全屏模式，保存当前视频索引
      if (prev === VIEW_MODE.LIST && newMode === VIEW_MODE.FULLSCREEN) {
        // currentVideoIndex 已经是最新的，直接使用
      }
      
      // 如果从全屏模式切换回列表模式，设置滚动位置
      if (prev === VIEW_MODE.FULLSCREEN && newMode === VIEW_MODE.LIST) {
        // 设置要滚动到的索引，以便列表模式滚动到对应位置
        setScrollToIndex(currentVideoIndex);
        // 滚动完成后重置 scrollToIndex
        setTimeout(() => {
          setScrollToIndex(null);
        }, 1000);
      }
      
      return newMode;
    });
  }, [currentVideoIndex]);

  // 列表模式的数据源（用于 VideoFeed）
  // 如果feedList已有数据，优先使用feedList，否则使用dataSource
  const listDataSource = useCallback(
    async (pageNum = 1, pageSize = 10) => {
      // 如果已经有数据且是第一页，直接返回已有数据
      if (pageNum === 1 && feedList.length > 0) {
        return {
          data: feedList.slice(0, pageSize),
          hasMore: feedList.length > pageSize || hasMore,
          total: feedList.length,
        };
      }
      
      const result = await dataSource(pageNum, pageSize);
      return {
        data: result.data,
        hasMore: result.hasMore,
        total: result.total,
      };
    },
    [dataSource, feedList, hasMore]
  );

  return (
    <div className={cx('wrapper')}>
      {/* 模式切换按钮 */}
      <button className={cx('mode-toggle')} onClick={toggleViewMode} aria-label="Toggle view mode">
        {viewMode === VIEW_MODE.LIST ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M4 4h4v4H4V4zm6 0h10v4H10V4zm-6 6h4v4H4v-4zm6 0h10v4H10v-4zm-6 6h4v4H4v-4zm6 0h10v4H10v-4z" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M4 4h16v16H4V4zm2 2v12h12V6H6z" />
          </svg>
        )}
      </button>

      {/* 根据模式显示不同组件 */}
      {viewMode === VIEW_MODE.LIST ? (
        <VideoFeed
          dataSource={listDataSource}
          transformData={transformData}
          emptyMessage="No videos available"
          pageSize={10}
          enableInfiniteScroll={true}
          maxItems={null}
          onVideoVisibilityChange={setCurrentVideoIndex}
          scrollToIndex={scrollToIndex}
        />
      ) : (
        <VideoFullscreenView
          feedList={feedList}
          onLoadMore={handleLoadMore}
          hasMore={hasMore}
          loadingMore={loadingMore}
          initialIndex={currentVideoIndex}
          onVideoIndexChange={setCurrentVideoIndex}
        />
      )}
    </div>
  );
}

export default Home;
