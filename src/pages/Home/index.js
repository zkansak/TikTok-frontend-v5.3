import { useState, useCallback, useEffect, useRef, startTransition } from 'react';
import classNames from 'classnames/bind';

import VideoFeed from '~/components/VideoFeed';
import VideoFullscreenView from '~/components/VideoFullscreenView';
import BannerCarousel from '~/components/BannerCarousel';
import Popup from '~/components/Popup';
import { getFeedPaginated } from '~/services/feedService';
import { getActiveResourcesByPlacement } from '~/services/activityService';
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

  // 活动资源状态
  const [topBanners, setTopBanners] = useState([]);
  const [bottomBanners, setBottomBanners] = useState([]);
  const [popups, setPopups] = useState([]);
  const [closedPopups, setClosedPopups] = useState(new Set());
  
  // 调试信息显示控制（从 localStorage 读取）
  const [debugInfoVisible, setDebugInfoVisible] = useState(() => {
    const saved = localStorage.getItem('debugInfoVisible');
    return saved === 'true';
  });

  // 监听 localStorage 变化，实时更新调试信息显示状态
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'debugInfoVisible') {
        setDebugInfoVisible(e.newValue === 'true');
      }
    };
    
    // 监听 storage 事件（跨标签页）
    window.addEventListener('storage', handleStorageChange);
    
    // 监听自定义事件（同标签页内）
    const handleCustomStorageChange = (e) => {
      if (e.detail?.key === 'debugInfoVisible') {
        setDebugInfoVisible(e.detail.value === 'true');
      }
    };
    window.addEventListener('customStorageChange', handleCustomStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('customStorageChange', handleCustomStorageChange);
    };
  }, []);

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

  // 预加载图片（使用多种方式确保尽早加载）
  const preloadImage = useCallback((url) => {
    if (!url) return;
    
    // 方式1: 使用 link preload（最高优先级）
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;
    link.fetchPriority = 'high';
    document.head.appendChild(link);
    
    // 方式2: 使用 Image 对象预加载（确保图片缓存）
    const img = new Image();
    img.src = url;
    img.loading = 'eager';
    img.fetchPriority = 'high';
  }, []);

  // 加载活动资源（优化LCP性能）
  const loadActivityResources = useCallback(async () => {
    try {
      // 优先加载顶部Banner（LCP元素）
      const topBannerData = await getActiveResourcesByPlacement('home_top', 'banner');
      
      // 立即设置顶部Banner状态，触发渲染
      if (topBannerData.length > 0) {
        const firstBanner = topBannerData[0];
        // 立即预加载第一个Banner图片（LCP元素），在设置状态之前
        if (firstBanner?.resourceUrl) {
          preloadImage(firstBanner.resourceUrl);
        }
        // 立即设置状态，触发组件渲染
        setTopBanners(topBannerData);
      }
      
      // 延迟加载其他资源，不阻塞LCP元素
      // 使用 startTransition 延迟非关键内容的更新，优先渲染 LCP 元素
      startTransition(async () => {
        const [bottomBannerData, popupData] = await Promise.all([
          getActiveResourcesByPlacement('home_bottom', 'banner'),
          getActiveResourcesByPlacement('home_center', 'popup'),
        ]);
        
        if (process.env.NODE_ENV === 'development') {
          console.log('📢 顶部Banner数据:', topBannerData);
          console.log('📢 底部Banner数据:', bottomBannerData);
          console.log('📢 弹窗数据:', popupData);
        }
        
        setBottomBanners(bottomBannerData);
        setPopups(popupData);
        
        // 预加载其他图片（延迟执行，不阻塞 LCP）
        bottomBannerData.forEach((banner) => preloadImage(banner?.resourceUrl));
        popupData.forEach((popup) => preloadImage(popup?.resourceUrl));
      });
    } catch (error) {
      console.error('❌ 加载活动资源失败:', error);
    }
  }, [preloadImage]);

  // 初始加载 - 优先加载活动资源（提升LCP）
  useEffect(() => {
    // 优先加载活动资源（关键路径）
    loadActivityResources();
    // 使用 startTransition 延迟加载视频数据，避免阻塞 Banner 渲染
    startTransition(() => {
      // 延迟加载视频数据，确保 Banner 优先渲染
      setTimeout(() => {
        loadData(1, true);
      }, 0);
    });
  }, [loadData, loadActivityResources]);

  // 处理弹窗关闭
  const handlePopupClose = useCallback((activityId) => {
    setClosedPopups((prev) => new Set([...prev, activityId]));
  }, []);

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
      {/* 顶部Banner轮播 */}
      {viewMode === VIEW_MODE.LIST && topBanners.length > 0 && (
        <div className={cx('banner-section', 'banner-top')}>
          <BannerCarousel activities={topBanners} autoPlayInterval={5000} />
        </div>
      )}
      
      {/* 调试信息（开发环境显示，且需要开启调试信息开关） */}
      {process.env.NODE_ENV === 'development' && debugInfoVisible && (
        <div style={{ 
          position: 'fixed', 
          bottom: '20px', 
          right: '20px', 
          background: 'rgba(0,0,0,0.8)', 
          color: '#fff', 
          padding: '12px', 
          borderRadius: '8px',
          fontSize: '12px',
          zIndex: 10000,
          maxWidth: '300px'
        }}>
          <div>🔍 活动资源调试信息</div>
          <div>顶部Banner: {topBanners.length} 个</div>
          <div>底部Banner: {bottomBanners.length} 个</div>
          <div>弹窗: {popups.length} 个</div>
          <div>已关闭弹窗: {closedPopups.size} 个</div>
        </div>
      )}

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
        <>
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
          {/* 底部Banner轮播 */}
          {bottomBanners.length > 0 && (
            <div className={cx('banner-section', 'banner-bottom')}>
              <BannerCarousel activities={bottomBanners} autoPlayInterval={5000} />
            </div>
          )}
        </>
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

      {/* 弹窗（只显示第一个未关闭的） */}
      {viewMode === VIEW_MODE.LIST &&
        popups.length > 0 &&
        popups
          .filter((popup) => !closedPopups.has(popup.id))
          .slice(0, 1)
          .map((activity) => (
            <Popup key={activity.id} activity={activity} onClose={() => handlePopupClose(activity.id)} />
          ))}
    </div>
  );
}

export default Home;
