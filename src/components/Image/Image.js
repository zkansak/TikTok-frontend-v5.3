import { useState, forwardRef, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames/bind';
import styles from './Image.module.scss';

import images from '~/assets/images';

const cx = classNames.bind(styles);
const Image = forwardRef(
  (
    {
      src,
      alt,
      fallback: customFallback = images.noImage,
      className,
      lazy = true, // 默认启用懒加载
      maxRetries = 2, // 最大重试次数
      retryDelay = 1000, // 重试延迟（毫秒）
      ...props
    },
    ref
  ) => {
    const [fallback, setFallBack] = useState('');
    const [currentSrc, setCurrentSrc] = useState(src);
    const retryCountRef = useRef(0);
    const retryTimerRef = useRef(null);

    const handleError = () => {
      // 如果还有重试次数，延迟后重试
      if (retryCountRef.current < maxRetries && currentSrc && currentSrc !== customFallback) {
        retryCountRef.current += 1;
        
        // 清除之前的定时器
        if (retryTimerRef.current) {
          clearTimeout(retryTimerRef.current);
        }
        
        // 延迟重试
        retryTimerRef.current = setTimeout(() => {
          // 通过添加时间戳强制重新加载
          const separator = currentSrc.includes('?') ? '&' : '?';
          setCurrentSrc(`${currentSrc}${separator}_retry=${retryCountRef.current}&_t=${Date.now()}`);
        }, retryDelay);
      } else {
        // 重试次数用完，使用 fallback
        setFallBack(customFallback);
        setCurrentSrc(customFallback);
      }
    };

    // 当 src 改变时，重置状态
    useEffect(() => {
      if (src && src !== currentSrc && src !== fallback) {
        setCurrentSrc(src);
        setFallBack('');
        retryCountRef.current = 0;
        if (retryTimerRef.current) {
          clearTimeout(retryTimerRef.current);
        }
      }
    }, [src, currentSrc, fallback]);

    return (
      <img
        className={cx('wrapper', className)}
        ref={ref}
        src={fallback || currentSrc}
        loading={lazy ? 'lazy' : 'eager'} // 添加懒加载属性
        {...props}
        alt={alt}
        onError={handleError}
        onLoad={() => {
          // 加载成功，重置重试计数
          if (retryCountRef.current > 0) {
            retryCountRef.current = 0;
          }
        }}
      />
    );
  }
);

Image.propTypes = {
  src: PropTypes.string,
  alt: PropTypes.string,
  fallback: PropTypes.string,
  className: PropTypes.string,
  lazy: PropTypes.bool, // 是否启用懒加载
  maxRetries: PropTypes.number, // 最大重试次数
  retryDelay: PropTypes.number, // 重试延迟（毫秒）
};

export default Image;
