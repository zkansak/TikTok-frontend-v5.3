import PropTypes from 'prop-types';
import classNames from 'classnames/bind';
import { Link } from 'react-router-dom';

import styles from './VideoCard.module.scss';
import { CommentIcon, LikeIcon, MutedIcon, PauseIcon, PlayIcon, ShareIcon, UnmutedIcon, TickIcon, MusicTagIcon } from '~/components/Icons';
import ActionButton from './ActionButton';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useVideoPlayer } from '~/hooks';
import Image from '~/components/Image';
import AccountWithTooltip from '~/components/AccountWithTooltip';
import config from '~/config';

const cx = classNames.bind(styles);

function VideoCard({ data, isFullscreen = false }) {
  const convertCount = useCallback((number) => {
    if (number > Math.pow(10, 9)) {
      return (number / Math.pow(10, 9)).toFixed(1) + 'B';
    } else if (number > Math.pow(10, 6)) {
      return (number / Math.pow(10, 6)).toFixed(1) + 'M';
    } else if (number > Math.pow(10, 3)) {
      return (number / Math.pow(10, 3)).toFixed(1) + 'K';
    }
    return number;
  }, []);

  const videoElement = useRef(null);
  const videoPlayer = useVideoPlayer(videoElement);

  // Avoid render action button again when video is playing
  const likeIcon = useMemo(() => <LikeIcon />, []);
  const shareIcon = useMemo(() => <ShareIcon />, []);
  const commentIcon = useMemo(() => <CommentIcon />, []);

  const convertTime = (time) => {
    const intMinute = Math.floor(time / 60);
    const intSecond = Math.floor(time) - intMinute * 60;
    return `${intMinute < 10 ? 0 : ''}${intMinute}:${intSecond < 10 ? 0 : ''}${intSecond}`;
  };

  const convertedDuration = useMemo(() => {
    return videoElement.current
      ? convertTime((videoPlayer.playerState.progress * videoElement.current.duration) / 100) +
          '/' +
          convertTime(videoElement.current.duration)
      : '00:00/--:--';
  }, [videoPlayer.playerState.progress]);

  // 处理描述文本（用于全屏模式）
  const handleDesc = useCallback(() => {
    const desc = (data && typeof data.desc === 'string') ? data.desc : '';
    const textExtra = Array.isArray(data?.text_extra) ? data.text_extra : [];
    if (textExtra.length === 0) {
      return [{ component: <span>{desc}</span> }];
    }
    const results = [];
    textExtra.forEach((ele, index, array) => {
      let a, b;
      a = index === 0 ? desc.substring(0, ele.start) : desc.substring(array[index - 1].end, ele.start);
      b = desc.substring(ele.start, ele.end);
      results.push({ component: <span>{a}</span> });
      results.push({
        component: (
          <Link to={`${config.routes.search}?q=${encodeURIComponent(b)}`}>
            <strong>{b}</strong>
          </Link>
        ),
      });
      if (index === textExtra.length - 1) {
        results.push({ component: <span>{desc.substring(ele.end, desc.length)}</span> });
      }
    });
    return results;
  }, [data]);

  const convertedDesc = useMemo(() => handleDesc(), [handleDesc]);

  // 全屏模式：控制描述展开/收起
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [needsMoreButton, setNeedsMoreButton] = useState(false);
  const descRef = useRef(null);
  const descMeasureRef = useRef(null); // 用于测量文本实际宽度

  // 当描述内容变化时，重置展开状态
  useEffect(() => {
    if (isFullscreen) {
      setIsDescExpanded(false);
    }
  }, [convertedDesc, isFullscreen]);

  // 检查描述是否需要"更多"按钮（单行溢出检测）
  useEffect(() => {
    if (!isFullscreen) {
      setNeedsMoreButton(false);
      return;
    }

    const checkOverflow = () => {
      if (!descMeasureRef.current || !descRef.current) return;
      
      const measureEl = descMeasureRef.current;
      const containerEl = descRef.current;
      
      // 确保测量元素在DOM中
      if (!measureEl.parentElement) return;
      
      // 测量元素已经设置为单行（white-space: nowrap），可以直接获取宽度
      // 由于元素是隐藏的，我们需要确保它已渲染
      const textWidth = measureEl.scrollWidth;
      
      // 如果宽度为0，说明元素还未渲染完成，跳过此次检查
      if (textWidth === 0) return;
      
      // 获取容器可用宽度（需要考虑按钮预留空间）
      const containerWidth = containerEl.clientWidth;
      // 为"更多"按钮预留约45px空间（按钮文字 + 间距）
      const availableWidth = containerWidth - 45;
      
      // 只有当文本宽度超过可用宽度时才显示"更多"按钮
      const isOverflowing = textWidth > availableWidth;
      setNeedsMoreButton(isOverflowing);
    };
    
    // 延迟检查，确保DOM已完全渲染
    const timeoutId = setTimeout(checkOverflow, 100);
    
    // 监听窗口大小变化和内容变化
    window.addEventListener('resize', checkOverflow);
    
    // 使用 ResizeObserver 监听容器大小变化
    let resizeObserver = null;
    if (descRef.current && window.ResizeObserver) {
      resizeObserver = new ResizeObserver(checkOverflow);
      resizeObserver.observe(descRef.current);
    }
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', checkOverflow);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [isFullscreen, convertedDesc]);

  // 移除旧的 progressRef，使用新的 TikTok 风格进度条

  // Build a prioritized list of playable sources with robust fallbacks
  const playableSources = useMemo(() => {
    const original = data?.video?.url || '';
    const sources = [];
    if (original) {
      try {
        const host = new URL(original).hostname || '';
        // Many TikTok CDN links are short-lived and 403 locally; prefer fallbacks first
        if (!host.includes('tiktokcdn.com')) {
          sources.push(original);
        }
      } catch (e) {
        sources.push(original);
      }
    }
    // Public demo videos, 优先使用 flower.mp4（更小更快）
    sources.push(
      'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4'
    );
    // 备用视频源
    sources.push(
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'
    );
    return sources;
  }, [data?.video?.url]);

  const [srcIndex, setSrcIndex] = useState(0);
  useEffect(() => setSrcIndex(0), [playableSources]);

  const handleVideoError = () => {
    if (srcIndex < playableSources.length - 1) {
      setSrcIndex((i) => i + 1);
    }
  };

  // Auto play/pause based on viewport visibility
  const containerRef = useRef(null);
  const isPlayingRef = useRef(false);
  const videoContainerRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const userPausedRef = useRef(false); // 标记用户是否手动暂停
  const [isDragging, setIsDragging] = useState(false); // 标记是否正在拖拽进度条
  const [dragProgress, setDragProgress] = useState(0); // 拖拽时的进度值

  useEffect(() => {
    isPlayingRef.current = videoPlayer.playerState.isPlaying;
    // 如果视频开始播放，清除手动暂停标记
    if (videoPlayer.playerState.isPlaying) {
      userPausedRef.current = false;
    }
  }, [videoPlayer.playerState.isPlaying]);

  // 处理鼠标悬停，显示/隐藏控件
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback((e) => {
    // 如果鼠标离开到音量按钮上，不隐藏
    if (e.relatedTarget && typeof e.relatedTarget.closest === 'function') {
      if (e.relatedTarget.closest('button') || e.relatedTarget.tagName === 'BUTTON') {
        return;
      }
    }
    setIsHovered(false);
  }, []);

  // 移除直接 DOM 操作，完全依赖 React 状态和 CSS 类

  // IntersectionObserver: 滑到即播放，离开即暂停
  useEffect(() => {
    if (!containerRef.current || !videoElement.current) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const ratio = entry.intersectionRatio || 0;
          const currentVideo = videoElement.current;
          if (!currentVideo) return;
          
          if (!entry.isIntersecting) {
            // 离开视口：自动暂停
            if (isPlayingRef.current) {
              videoPlayer.pause();
            }
            return;
          }

          // 如果用户手动暂停了，不要自动播放
          if (userPausedRef.current) {
            return;
          }

          // 进入视口：可见比例超过 0.6 时自动播放
          // 使用滞后阈值避免频繁切换：>=0.6 播放, <=0.45 暂停
          if (!isPlayingRef.current && ratio >= 0.6) {
            videoPlayer.play();
          } else if (isPlayingRef.current && ratio <= 0.45) {
            videoPlayer.pause();
          }
        });
      },
      { 
        threshold: [0, 0.25, 0.45, 0.6, 0.7, 1], // 包含 0.6 阈值用于播放触发
        rootMargin: '100px' // 提前加载，优化体验
      }
    );
    
    observer.observe(containerRef.current);
    
    return () => {
      observer.disconnect();
    };
  }, [videoPlayer]);

  return (
    <div className={cx('video-container', { fullscreen: isFullscreen })} ref={containerRef}>
      <div
        className={cx('video-card-container', {
          portrait: data.video.height > data.video.width,
          landscape: data.video.height <= data.video.width,
          fullscreen: isFullscreen,
        })}
      >
        <canvas
          width={(data.video.width / data.video.height) * 100}
          height={100}
          className={cx('canvas-placeholder')}
        />
        <div 
          ref={videoContainerRef}
          className={cx('video-player-container')}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          // 移除 onMouseDown 处理，让浏览器默认处理（用于文本选择）
          // 进度条区域的拖拽已经在进度条组件内部处理了
          onTouchStart={(e) => {
            // 如果触摸的是进度条区域，阻止事件冒泡到全屏滑动处理
            const progressContainer = e.target.closest(`.${cx('progress-container')}`);
            const progressWrapper = e.target.closest(`.${cx('progress-bar-wrapper')}`);
            const progressHandle = e.target.closest(`.${cx('progress-handle')}`);
            
            // 检查是否在视频底部区域（进度条区域）
            const rect = videoContainerRef.current?.getBoundingClientRect();
            if (rect && e.touches && e.touches[0]) {
              const touchY = e.touches[0].clientY;
              const relativeY = touchY - rect.top;
              const containerHeight = rect.height;
              const isInBottomArea = relativeY > containerHeight * 0.9;
              
              if (progressContainer || progressWrapper || progressHandle || isInBottomArea) {
                // 让进度条处理拖拽，阻止事件冒泡到全屏滑动处理
                e.stopPropagation();
                return;
              }
            }
          }}
          onClick={(e) => {
            // 如果点击的是按钮（包括音量按钮），不触发播放/暂停
            if (e.target.tagName === 'BUTTON' || e.target.closest('button') !== null) {
              return;
            }
            // 如果点击的是进度条区域，不触发播放/暂停
            if (e.target.closest(`.${cx('progress-container')}`) || 
                e.target.closest(`.${cx('progress-bar-wrapper')}`) ||
                e.target.closest(`.${cx('progress-handle')}`)) {
              return;
            }
            // 如果点击的是容器而不是按钮，也触发播放/暂停
            if (e.target.tagName !== 'VIDEO') {
              e.preventDefault();
              e.stopPropagation();
              console.log('Container clicked, toggling play');
              const willPause = videoPlayer.playerState.isPlaying;
              videoPlayer.togglePlay();
              // 如果用户点击暂停，标记为手动暂停
              if (willPause) {
                userPausedRef.current = true;
              }
            }
          }}
        >
          <video
            ref={videoElement}
            className={cx('video-player')}
            src={playableSources[srcIndex]} // 直接在 JSX 中设置，浏览器自动管理
            onTimeUpdate={videoPlayer.handleOnTimeUpdate}
            onError={handleVideoError}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation(); // 阻止事件冒泡
              console.log('Video clicked, toggling play');
              const willPause = videoPlayer.playerState.isPlaying;
              videoPlayer.togglePlay(); // 点击视频暂停/播放
              // 如果用户点击暂停，标记为手动暂停
              if (willPause) {
                userPausedRef.current = true;
              }
            }}
            preload="metadata" // 预加载元数据，更快首帧
            muted={videoPlayer.playerState.isMuted} // 根据状态控制静音
            playsInline
            disablePictureInPicture
            controls={false} // 禁用浏览器原生控件，使用自定义控件
          />
          
          {/* 覆盖层 - 参考 TikTok 结构 */}
          <div className={cx('video-overlay')}>
            {/* 顶部控件区域 */}
            <div className={cx('overlay-top')}>
              <div className={cx('top-controls')}>
                <button
                  className={cx('volume-button', { 
                    'is-muted': videoPlayer.playerState.isMuted,
                    'is-visible': isHovered
                  })}
                  onMouseEnter={() => setIsHovered(true)} // 鼠标进入按钮时保持显示
                  onMouseLeave={(e) => {
                    // 如果鼠标离开到视频容器上，不隐藏
                    if (e.relatedTarget && typeof e.relatedTarget.closest === 'function') {
                      if (e.relatedTarget.closest(`.${cx('video-player-container')}`)) {
                        return;
                      }
                    }
                    setIsHovered(false);
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.nativeEvent.stopImmediatePropagation(); // 阻止所有事件冒泡
                    console.log('Volume button clicked, current muted:', videoPlayer.playerState.isMuted);
                    videoPlayer.toggleMuted();
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.nativeEvent.stopImmediatePropagation(); // 阻止所有事件冒泡
                  }}
                  aria-label="音量"
                  type="button"
                >
                  {videoPlayer.playerState.isMuted ? <UnmutedIcon /> : <MutedIcon />}
                </button>
          </div>
            </div>
            
            {/* 底部控件区域 - 扩大拖拽区域到视频下部10% */}
            <div className={cx('overlay-bottom')}>
              {/* 全屏模式：用户信息覆盖层（底部左侧）- 用盒子装起来，分四行 */}
              {isFullscreen && (
                <div className={cx('fullscreen-info-overlay')}>
                  <div className={cx('fullscreen-info-box')}>
                    {/* 第一行：名字 */}
                    <div className={cx('fullscreen-info-row', 'fullscreen-info-row-name')}>
                      <AccountWithTooltip data={data.author} tick={data.author.custom_verify !== ''} offset={[0, 30]} inHomeMenu>
                        <Link
                          to={`${config.routes.profile.split(':')[0]}@${data.author.uniqueId || data.author.unique_id}`}
                          className={cx('fullscreen-author-link')}
                        >
                          <h3 className={cx('fullscreen-author-title')}>
                            {data.author.unique_id}
                            {data.author.custom_verify !== '' && <TickIcon className={cx('fullscreen-tick-icon')} />}
                          </h3>
                        </Link>
                      </AccountWithTooltip>
                    </div>

                    {/* 第二行：简介（省略号 + "更多"/"更少"按钮） */}
                    <div className={cx('fullscreen-info-row', 'fullscreen-info-row-desc')}>
                      <div 
                        ref={descRef}
                        className={cx('fullscreen-video-desc', { expanded: isDescExpanded })}
                      >
                        {/* 用于测量文本宽度的隐藏元素 */}
                        <div 
                          ref={descMeasureRef}
                          className={cx('fullscreen-video-desc-measure')}
                        >
                          {convertedDesc.map((ele, index) => (
                            <span key={index}>{ele.component}</span>
                          ))}
                        </div>
                        {/* 实际显示的文本 */}
                        <div className={cx('fullscreen-video-desc-content')}>
                          {convertedDesc.map((ele, index) => (
                            <span key={index}>{ele.component}</span>
                          ))}
                        </div>
                      </div>
                      {needsMoreButton && (
                        <button
                          className={cx('fullscreen-more-button')}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsDescExpanded(!isDescExpanded);
                          }}
                          type="button"
                        >
                          {isDescExpanded ? '更少' : '更多'}
                        </button>
                      )}
                    </div>

                    {/* 第三行：翻译功能 */}
                    <div className={cx('fullscreen-info-row', 'fullscreen-info-row-translate')}>
                      <button
                        className={cx('fullscreen-translate-button')}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          // TODO: 实现翻译功能
                        }}
                        type="button"
                      >
                        查看翻译
                      </button>
                    </div>

                    {/* 第四行：音乐 */}
                    <div className={cx('fullscreen-info-row', 'fullscreen-info-row-music')}>
                      <h4 className={cx('fullscreen-music-container')}>
                        <MusicTagIcon className={cx('fullscreen-music-icon')} />
                        <Link
                          to={`${config.routes.music.split(':')[0]}${(data.music?.title || '').replace(/ /g, '-')}-${data.music?.id || ''}`}
                          className={cx('fullscreen-music-title')}
                        >
                          {data.music?.title || ''}
                        </Link>
                      </h4>
                    </div>
                  </div>
                </div>
              )}
              {/* 时间显示 - 拖拽时显示在进度条上方 */}
              {isDragging && (
                <div className={cx('time-display-large')}>
                  {videoElement.current && videoElement.current.duration
                    ? `${convertTime((dragProgress / 100) * videoElement.current.duration)} / ${convertTime(videoElement.current.duration)}`
                    : '00:00 / 00:00'}
                </div>
              )}
              {/* 进度条 - TikTok 风格，扩大拖拽区域 */}
              <div 
                className={cx('progress-container', { dragging: isDragging })}
                onMouseDown={(e) => {
                  // 阻止事件冒泡，防止触发其他区域的拖拽
                  e.stopPropagation();
                }}
                onTouchStart={(e) => {
                  // 阻止事件冒泡，防止触发其他区域的拖拽
                  e.stopPropagation();
                }}
              >
                <div 
                  className={cx('progress-bar-wrapper')}
                  onMouseDown={(e) => {
                    // 阻止事件冒泡到父容器
                    e.stopPropagation();
                    // 如果点击的是手柄，不处理（由手柄的拖拽逻辑处理）
                    if (e.target.classList.contains(cx('progress-handle'))) {
                      return;
                    }
                    // 在底部10%区域内开始拖拽
                    setIsDragging(true);
                    const rect = e.currentTarget.getBoundingClientRect();
                    const initialX = e.clientX - rect.left;
                    const width = rect.width;
                    const initialProgress = Math.max(0, Math.min(100, (initialX / width) * 100));
                    setDragProgress(initialProgress);
                    
                    // 使用 requestAnimationFrame 优化拖拽性能
                    let rafId = null;
                    const handleMouseMove = (moveEvent) => {
                      // 阻止默认行为，防止文本选择
                      moveEvent.preventDefault();
                      if (rafId) {
                        cancelAnimationFrame(rafId);
                      }
                      rafId = requestAnimationFrame(() => {
                        const moveX = moveEvent.clientX - rect.left;
                        const progressPercent = Math.max(0, Math.min(100, (moveX / width) * 100));
                        setDragProgress(progressPercent);
                      });
                    };
                    const handleMouseUp = () => {
                      if (rafId) {
                        cancelAnimationFrame(rafId);
                      }
                      if (videoElement.current && videoElement.current.duration) {
                        const newTime = (dragProgress / 100) * videoElement.current.duration;
                        videoElement.current.currentTime = newTime;
                        videoPlayer.handleVideoProgress({ target: { value: dragProgress } });
                      }
                      setIsDragging(false);
                      document.removeEventListener('mousemove', handleMouseMove);
                      document.removeEventListener('mouseup', handleMouseUp);
                    };
                    document.addEventListener('mousemove', handleMouseMove);
                    document.addEventListener('mouseup', handleMouseUp);
                  }}
                  onClick={(e) => {
                    // 阻止事件冒泡
                    e.stopPropagation();
                    // 如果点击的是手柄，不处理（由手柄的拖拽逻辑处理）
                    if (e.target.classList.contains(cx('progress-handle'))) {
                      return;
                    }
                    // 点击进度条背景或填充区域时跳转
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    const width = rect.width;
                    const progressPercent = Math.max(0, Math.min(100, (clickX / width) * 100));
                    if (videoElement.current && videoElement.current.duration) {
                      const newTime = (progressPercent / 100) * videoElement.current.duration;
                      videoElement.current.currentTime = newTime;
                      videoPlayer.handleVideoProgress({ target: { value: progressPercent } });
                    }
                  }}
                >
                  <div className={cx('progress-bar-bg')}></div>
                  <div 
                    className={cx('progress-bar-filled')}
                    style={{ width: `${isDragging ? dragProgress : videoPlayer.playerState.progress}%` }}
                  ></div>
                  <div
                    className={cx('progress-handle')}
                    style={{ left: `${isDragging ? dragProgress : videoPlayer.playerState.progress}%` }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDragging(true);
                      const wrapper = e.currentTarget.closest(`.${cx('progress-bar-wrapper')}`);
                      const rect = wrapper.getBoundingClientRect();
                      const initialX = e.clientX - rect.left;
                      const width = rect.width;
                      const initialProgress = Math.max(0, Math.min(100, (initialX / width) * 100));
                      setDragProgress(initialProgress);
                      
                      // 使用 requestAnimationFrame 优化拖拽性能
                      let rafId = null;
                      const handleMouseMove = (moveEvent) => {
                        // 阻止默认行为，防止文本选择
                        moveEvent.preventDefault();
                        if (rafId) {
                          cancelAnimationFrame(rafId);
                        }
                        rafId = requestAnimationFrame(() => {
                          const moveX = moveEvent.clientX - rect.left;
                          const progressPercent = Math.max(0, Math.min(100, (moveX / width) * 100));
                          setDragProgress(progressPercent);
                        });
                      };
                      const handleMouseUp = () => {
                        if (rafId) {
                          cancelAnimationFrame(rafId);
                        }
                        if (videoElement.current && videoElement.current.duration) {
                          const newTime = (dragProgress / 100) * videoElement.current.duration;
                          videoElement.current.currentTime = newTime;
                          videoPlayer.handleVideoProgress({ target: { value: dragProgress } });
                        }
                        setIsDragging(false);
                        document.removeEventListener('mousemove', handleMouseMove);
                        document.removeEventListener('mouseup', handleMouseUp);
                      };
                      document.addEventListener('mousemove', handleMouseMove);
                      document.addEventListener('mouseup', handleMouseUp);
                    }}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDragging(true);
                      const wrapper = e.currentTarget.closest(`.${cx('progress-bar-wrapper')}`);
                      const rect = wrapper.getBoundingClientRect();
                      const touch = e.touches[0];
                      const touchX = touch.clientX - rect.left;
                      const width = rect.width;
                      const initialProgress = Math.max(0, Math.min(100, (touchX / width) * 100));
                      setDragProgress(initialProgress);
                      
                      const handleTouchMove = (moveEvent) => {
                        // 阻止默认行为，防止页面滚动
                        moveEvent.preventDefault();
                        const touch = moveEvent.touches[0];
                        const moveX = touch.clientX - rect.left;
                        const progressPercent = Math.max(0, Math.min(100, (moveX / width) * 100));
                        setDragProgress(progressPercent);
                      };
                      const handleTouchEnd = () => {
                        if (videoElement.current && videoElement.current.duration) {
                          const newTime = (dragProgress / 100) * videoElement.current.duration;
                          videoElement.current.currentTime = newTime;
                          videoPlayer.handleVideoProgress({ target: { value: dragProgress } });
                        }
                        setIsDragging(false);
                        document.removeEventListener('touchmove', handleTouchMove);
                        document.removeEventListener('touchend', handleTouchEnd);
                      };
                      document.addEventListener('touchmove', handleTouchMove);
                      document.addEventListener('touchend', handleTouchEnd);
                    }}
                  ></div>
                </div>
              </div>
            </div>
            
            {/* 中央播放/暂停按钮 */}
            <button 
              className={cx('play-button', { 'is-visible': isHovered || !videoPlayer.playerState.isPlaying })} 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Play button clicked, current playing:', videoPlayer.playerState.isPlaying);
                const willPause = videoPlayer.playerState.isPlaying;
                videoPlayer.togglePlay();
                // 如果用户点击暂停，标记为手动暂停
                if (willPause) {
                  userPausedRef.current = true;
                } else {
                  // 如果用户点击播放，清除手动暂停标记
                  userPausedRef.current = false;
                }
              }}
              aria-label={videoPlayer.playerState.isPlaying ? '暂停' : '播放'}
              type="button"
            >
              {videoPlayer.playerState.isPlaying ? <PauseIcon /> : <PlayIcon />}
            </button>
          </div>
        </div>
      </div>

      <div className={cx('action-container', { fullscreen: isFullscreen })}>
        {/* 全屏模式：头像和关注按钮 - 参考 TikTok 的 DivAvatarActionItemContainer */}
        {isFullscreen && (
          <div className={cx('fullscreen-avatar-container')}>
            <AccountWithTooltip
              data={data.author}
              tick={data.author.custom_verify !== ''}
              placement="top"
              inHomeMenu
            >
              <Link
                to={`${config.routes.profile.split(':')[0]}@${data.author.uniqueId || data.author.unique_id}`}
                className={cx('fullscreen-avatar-link')}
              >
                <Image 
                  alt={data.author.unique_id} 
                  src={data.author.avatar_thumb.url_list[0]} 
                  className={cx('fullscreen-avatar-img')} 
                />
              </Link>
            </AccountWithTooltip>
            <button 
              className={cx('fullscreen-follow-button')}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              type="button"
              aria-label="关注"
              data-e2e="feed-follow"
            >
              <svg width="16" height="16" viewBox="0 0 48 48" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M26 7a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v15H7a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h15v15a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1V26h15a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H26V7Z"></path>
              </svg>
            </button>
          </div>
        )}
        <ActionButton icon={likeIcon} detailCount={convertCount(data.statistics.digg_count)} />
        <ActionButton icon={commentIcon} detailCount={convertCount(data.statistics.comment_count)} />
        <ActionButton icon={shareIcon} detailCount={convertCount(data.statistics.share_count)} />
      </div>
    </div>
  );
}

VideoCard.propTypes = {
  data: PropTypes.object.isRequired,
  isFullscreen: PropTypes.bool,
};

export default VideoCard;
