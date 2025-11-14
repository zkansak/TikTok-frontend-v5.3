import { useState, useEffect, memo, useRef } from 'react';
import { CloseOutlined } from '@ant-design/icons';
import classNames from 'classnames/bind';
import styles from './Banner.module.scss';

const cx = classNames.bind(styles);

/**
 * Banner组件
 * 用于在页面中显示活动Banner
 * 
 * @param {Object} activity - 活动配置对象
 * @param {string} activity.id - 活动ID
 * @param {string} activity.resourceUrl - 资源URL
 * @param {string} activity.targetUrl - 跳转链接
 * @param {string} activity.placement - 投放位置
 * @param {string} activity.displayRule - 显示规则
 * @param {Function} onClose - 关闭回调
 */
function Banner({ activity, onClose }) {
  const [visible, setVisible] = useState(true);
  const storageKey = `banner_closed_${activity.id}`;
  const closeButtonRef = useRef(null);

  useEffect(() => {
    // 检查是否已关闭（根据显示规则）
    if (activity.displayRule === 'first_visit') {
      // 首次访问：检查 localStorage
      const isClosed = localStorage.getItem(storageKey);
      if (isClosed) {
        setVisible(false);
        if (onClose) onClose();
      }
    } else if (activity.displayRule === 'once_per_session') {
      // 每次会话：检查 sessionStorage
      const isClosed = sessionStorage.getItem(storageKey);
      if (isClosed) {
        setVisible(false);
        if (onClose) onClose();
      }
    }
    // 'every_visit' 和 'always' 每次都显示，不检查缓存
  }, [activity.displayRule, activity.id, storageKey, onClose]);

  const handleClose = () => {
    setVisible(false);
    
    // 根据显示规则决定是否缓存关闭状态
    if (activity.displayRule === 'first_visit') {
      // 首次访问：永久缓存
      localStorage.setItem(storageKey, 'true');
    } else if (activity.displayRule === 'once_per_session') {
      // 每次会话：sessionStorage
      sessionStorage.setItem(storageKey, 'true');
    }
    // 'every_visit' 和 'always' 不缓存，下次访问还会显示

    if (onClose) onClose();
  };

  if (!visible || !activity) return null;

  const handleClick = (e) => {
    // 如果点击的是关闭按钮或其子元素，不跳转
    if (closeButtonRef.current && (closeButtonRef.current === e.target || closeButtonRef.current.contains(e.target))) {
      return;
    }
    
    // 如果有跳转链接，执行跳转
    if (activity.targetUrl) {
      e.preventDefault();
      e.stopPropagation();
      
      let targetUrl = activity.targetUrl.trim();
      
      // 判断是外链还是相对路径
      if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) {
        // 已有协议的外链：在新标签页打开
        window.open(targetUrl, '_blank', 'noopener,noreferrer');
      } else if (targetUrl.startsWith('www.') || targetUrl.includes('.')) {
        // 没有协议但看起来像外链（包含 www. 或有点号）：自动添加 https://
        window.open(`https://${targetUrl}`, '_blank', 'noopener,noreferrer');
      } else {
        // 相对路径：在当前页面跳转
        window.location.href = targetUrl;
      }
    }
  };

  return (
    <div className={cx('banner-wrapper', `placement-${activity.placement}`)}>
      <div className={cx('banner-container')} onClick={handleClick}>
            <img
              src={activity.resourceUrl}
              alt={activity.name || 'Banner'}
              className={cx('banner-image')}
              loading="eager"
              fetchpriority="high"
              decoding="async"
              width="1150"
              height="200"
              style={{ aspectRatio: '1150/200' }}
              onError={(e) => {
                e.target.style.display = 'none';
                if (e.target.nextSibling) {
                  e.target.nextSibling.style.display = 'flex';
                }
              }}
            />
        <div className={cx('banner-placeholder')} style={{ display: 'none' }}>
          <span>Banner图片加载失败</span>
        </div>
        <button
          ref={closeButtonRef}
          className={cx('close-button')}
          onClick={handleClose}
          aria-label="关闭Banner"
          type="button"
        >
          <CloseOutlined />
        </button>
      </div>
    </div>
  );
}

// 使用 memo 优化性能，避免不必要的重渲染
export default memo(Banner);

