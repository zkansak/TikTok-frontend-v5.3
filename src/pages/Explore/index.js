import classNames from 'classnames/bind';
import VideoFeed from '~/components/VideoFeed';
import fakeFeedAPI from '~/assets/json/fakeFeedAPI.json';
import { transformVideoList } from '~/utils/dataTransform';

import styles from './Explore.module.scss';

const cx = classNames.bind(styles);

function Explore() {
  // 数据源：探索页面数据
  const dataSource = () => {
    return Promise.resolve(fakeFeedAPI);
  };

  // 数据转换函数
  const transformData = (data) => {
    return transformVideoList(data);
  };

  return (
    <div className={cx('wrapper')}>
      {/* 内容区域 */}
      <div className={cx('content')}>
        <VideoFeed
          dataSource={dataSource}
          transformData={transformData}
          emptyMessage="No content available"
        />
      </div>
    </div>
  );
}

export default Explore;

