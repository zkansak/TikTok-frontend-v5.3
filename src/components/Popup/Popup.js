import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { CloseOutlined } from '@ant-design/icons';
import classNames from 'classnames/bind';
import { Link } from 'react-router-dom';
import styles from './Popup.module.scss';

const cx = classNames.bind(styles);

/**
 * 弹窗组件
 * 用于在页面中央显示活动弹窗
 * 
 * @param {Object} activity - 活动配置对象
 * @param {string} activity.id - 活动ID
 * @param {string} activity.resourceUrl - 资源URL
 * @param {string} activity.targetUrl - 跳转链接
 * @param {string} activity.displayRule - 显示规则
 * @param {Function} onClose - 关闭回调
 */
function Popup({ activity, onClose }) {
  // 使用 useMemo 优化 storageKey 计算
  const storageKey = useMemo(() => `popup_closed_${activity?.id}`, [activity?.id]);
  
  // 初始可见性检查（同步执行，避免延迟）
  const initialVisible = useMemo(() => {
    if (!activity) return false;
    
    // 对于 'every_visit' 和 'always'，直接显示
    if (activity.displayRule === 'every_visit' || activity.displayRule === 'always') {
      return true;
    }
    
    // 对于需要检查缓存的规则，同步检查
    if (activity.displayRule === 'first_visit') {
      return !localStorage.getItem(storageKey);
    }
    
    if (activity.displayRule === 'once_per_session') {
      return !sessionStorage.getItem(storageKey);
    }
    
    return true;
  }, [activity, storageKey]);
  
  const [visible, setVisible] = useState(initialVisible);

  const handleClose = useCallback(() => {
    setVisible(false);
    
    // 根据显示规则决定是否缓存关闭状态
    if (activity?.displayRule === 'first_visit') {
      // 首次访问：永久缓存
      localStorage.setItem(storageKey, 'true');
    } else if (activity?.displayRule === 'once_per_session') {
      // 每次会话：sessionStorage
      sessionStorage.setItem(storageKey, 'true');
    }
    // 'every_visit' 和 'always' 不缓存，下次访问还会显示

    if (onClose) onClose();
  }, [activity?.displayRule, storageKey, onClose]);

  const handleOverlayClick = useCallback((e) => {
    // 点击遮罩层关闭
    if (e.target === e.currentTarget) {
      handleClose();
    }
  }, [handleClose]);

  const handleContentClick = useCallback((e) => {
    // 如果点击的是关闭按钮，不跳转
    if (e.target.closest(`.${cx('close-button')}`)) {
      return;
    }
    // 其他区域点击跳转
    if (activity.targetUrl) {
      if (activity.targetUrl.startsWith('http')) {
        window.open(activity.targetUrl, '_blank');
      } else {
        // 相对路径，使用路由跳转
        window.location.href = activity.targetUrl;
      }
      handleClose();
    }
  }, [activity?.targetUrl, handleClose]);

  // 图片预加载
  useEffect(() => {
    if (activity?.resourceUrl && visible) {
      const img = new Image();
      img.src = activity.resourceUrl;
    }
  }, [activity?.resourceUrl, visible]);

  if (!visible || !activity) return null;

  return (
    <div className={cx('popup-overlay')} onClick={handleOverlayClick}>
      <div className={cx('popup-container')}>
        <div className={cx('popup-content')} onClick={handleContentClick}>
          {activity.targetUrl && !activity.targetUrl.startsWith('http') ? (
            <Link to={activity.targetUrl} className={cx('popup-link')}>
              <img
                src={activity.resourceUrl}
                alt={activity.name || '弹窗'}
                className={cx('popup-image')}
                loading="eager"
                decoding="async"
                onError={(e) => {
                  e.target.style.display = 'none';
                  if (e.target.nextSibling) {
                    e.target.nextSibling.style.display = 'flex';
                  }
                }}
              />
              <div className={cx('popup-placeholder')} style={{ display: 'none' }}>
                <span>弹窗图片加载失败</span>
              </div>
            </Link>
          ) : (
            <>
              <img
                src={activity.resourceUrl}
                alt={activity.name || '弹窗'}
                className={cx('popup-image')}
                loading="eager"
                decoding="async"
                onError={(e) => {
                  e.target.style.display = 'none';
                  if (e.target.nextSibling) {
                    e.target.nextSibling.style.display = 'flex';
                  }
                }}
              />
              <div className={cx('popup-placeholder')} style={{ display: 'none' }}>
                <span>弹窗图片加载失败</span>
              </div>
            </>
          )}
          <button
            className={cx('close-button')}
            onClick={handleClose}
            aria-label="关闭弹窗"
            type="button"
          >
            <CloseOutlined />
          </button>
        </div>
      </div>
    </div>
  );
}

// 使用 memo 优化性能
export default memo(Popup);

