import classNames from 'classnames/bind';
import PropTypes from 'prop-types';
import styles from './VideoSkeleton.module.scss';

const cx = classNames.bind(styles);

function VideoSkeleton({ count = 1 }) {
  const skeletons = Array.from({ length: count }, (_, index) => (
    <div key={index} className={cx('wrapper')}>
      {/* 头像骨架 */}
      <div className={cx('avatar-skeleton')}>
        <div className={cx('skeleton-circle')}></div>
      </div>

      {/* 内容区域骨架 */}
      <div className={cx('content-skeleton')}>
        {/* 用户信息骨架 */}
        <div className={cx('user-info-skeleton')}>
          <div className={cx('skeleton-line', 'username')}></div>
          <div className={cx('skeleton-line', 'description')}></div>
        </div>

        {/* 视频卡片骨架 */}
        <div className={cx('video-card-skeleton')}>
          <div className={cx('skeleton-rectangle', 'video')}></div>
        </div>

        {/* 操作按钮骨架 */}
        <div className={cx('actions-skeleton')}>
          <div className={cx('skeleton-circle', 'action-btn')}></div>
          <div className={cx('skeleton-circle', 'action-btn')}></div>
          <div className={cx('skeleton-circle', 'action-btn')}></div>
        </div>
      </div>
    </div>
  ));

  return <>{skeletons}</>;
}

VideoSkeleton.propTypes = {
  count: PropTypes.number,
};

export default VideoSkeleton;

