import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import classNames from 'classnames/bind';
import Banner from '../Banner';
import styles from './BannerCarousel.module.scss';

const cx = classNames.bind(styles);

/**
 * Banner轮播组件
 * 支持多个Banner自动轮播和手动切换
 * 
 * @param {Array} activities - 活动数组
 * @param {number} autoPlayInterval - 自动播放间隔（毫秒），0表示不自动播放
 * @param {Function} onClose - 关闭回调
 */
function BannerCarousel({ activities = [], autoPlayInterval = 5000, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef(null);

  // 手动切换到上一张
  const handlePrev = useCallback((e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + (activities?.length || 0)) % (activities?.length || 1));
    setIsPaused(true);
    // 3秒后恢复自动播放
    setTimeout(() => setIsPaused(false), 3000);
  }, [activities?.length]);

  // 手动切换到下一张
  const handleNext = useCallback((e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % (activities?.length || 1));
    setIsPaused(true);
    // 3秒后恢复自动播放
    setTimeout(() => setIsPaused(false), 3000);
  }, [activities?.length]);

  // 点击指示器切换
  const handleIndicatorClick = useCallback((index) => {
    setCurrentIndex(index);
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 3000);
  }, []);

  // 鼠标悬停时暂停
  const handleMouseEnter = useCallback(() => {
    setIsPaused(true);
  }, []);

  // 鼠标离开时恢复
  const handleMouseLeave = useCallback(() => {
    setIsPaused(false);
  }, []);

  // 自动播放
  useEffect(() => {
    if (autoPlayInterval > 0 && !isPaused && activities.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % activities.length);
      }, autoPlayInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [autoPlayInterval, isPaused, activities?.length]);

  // 如果没有活动，不渲染
  if (!activities || activities.length === 0) return null;

  // 如果只有一个活动，直接显示，不需要轮播
  if (activities.length === 1) {
    return <Banner activity={activities[0]} onClose={onClose} />;
  }

  const currentActivity = activities[currentIndex];
  
  // 优化：只渲染当前和相邻的 Banner，减少初始渲染负担（提升 LCP）
  // 第一个 Banner（index 0）是 LCP 元素，优先渲染
  const visibleIndices = [];
  if (currentIndex === 0) {
    // 如果是第一个，只渲染前两个（当前和下一个）
    visibleIndices.push(0, 1);
  } else {
    // 否则渲染前一个、当前、下一个
    const prevIndex = (currentIndex - 1 + activities.length) % activities.length;
    const nextIndex = (currentIndex + 1) % activities.length;
    visibleIndices.push(prevIndex, currentIndex, nextIndex);
  }

  return (
    <div 
      className={cx('carousel-wrapper')}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className={cx('carousel-container')}>
        {/* 轮播内容 - 只渲染可见的 Banner */}
        <div className={cx('carousel-content')}>
          {activities.map((activity, index) => {
            // 只渲染可见的 Banner
            if (!visibleIndices.includes(index)) {
              return null;
            }
            return (
              <div
                key={activity.id}
                className={cx('carousel-item', {
                  active: index === currentIndex,
                  prev: index === (currentIndex - 1 + activities.length) % activities.length,
                  next: index === (currentIndex + 1) % activities.length,
                })}
              >
                <Banner activity={activity} onClose={onClose} />
              </div>
            );
          })}
        </div>

        {/* 左右切换按钮 */}
        {activities.length > 1 && (
          <>
            <button
              className={cx('nav-button', 'nav-prev')}
              onClick={handlePrev}
              aria-label="上一张"
              type="button"
            >
              <LeftOutlined />
            </button>
            <button
              className={cx('nav-button', 'nav-next')}
              onClick={handleNext}
              aria-label="下一张"
              type="button"
            >
              <RightOutlined />
            </button>
          </>
        )}

        {/* 指示器 */}
        {activities.length > 1 && (
          <div className={cx('indicators')}>
            {activities.map((_, index) => (
              <button
                key={index}
                className={cx('indicator', { active: index === currentIndex })}
                onClick={() => handleIndicatorClick(index)}
                aria-label={`切换到第${index + 1}张`}
                type="button"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// 使用 memo 优化性能
export default memo(BannerCarousel);

