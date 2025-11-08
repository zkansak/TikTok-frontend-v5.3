import VideoFeed from '~/components/VideoFeed';
import fakeFeedAPI from '~/assets/json/fakeFeedAPI.json';
import { transformVideoList } from '~/utils/dataTransform';

function Following() {
  // 数据源：关注流数据（取前8条）
  const dataSource = () => {
    return Promise.resolve(fakeFeedAPI.slice(0, 8));
  };

  // 数据转换函数
  const transformData = (data) => {
    return transformVideoList(data);
  };

  return (
    <VideoFeed
      dataSource={dataSource}
      transformData={transformData}
      emptyMessage="还没有关注任何人"
    />
  );
}

export default Following;

