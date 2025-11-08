import classNames from 'classnames/bind';
import VideoFeed from '~/components/VideoFeed';
import fakeFeedAPI from '~/assets/json/fakeFeedAPI.json';
import { transformVideoList } from '~/utils/dataTransform';

import styles from './Activity.module.scss';

const cx = classNames.bind(styles);

function Activity() {
  // 数据源：活动数据（取前5条）
  const dataSource = () => {
    return Promise.resolve(fakeFeedAPI.slice(0, 5));
  };

  // 数据转换函数
  const transformData = (data) => {
    return transformVideoList(data);
  };

  return (
    <div className={cx('wrapper')}>
      <div className={cx('container')}>
        <div className={cx('header')}>
          <h1 className={cx('title')}>活动中心</h1>
          <p className={cx('subtitle')}>发现精彩活动和热门内容</p>
        </div>

        <div className={cx('content')}>
          <VideoFeed
            dataSource={dataSource}
            transformData={transformData}
            emptyMessage="暂无活动内容"
          />
        </div>
      </div>
    </div>
  );
}

export default Activity;

