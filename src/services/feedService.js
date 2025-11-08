import * as httpRequest from '~/utils/httpRequest';

/**
 * 获取 Feed 流数据
 * @param {string} region - 地区代码，默认 'VN'
 * @param {string} device_id - 设备 ID，默认 '7214293347836528130'
 * @param {number} page - 页码，从 1 开始，默认 1
 * @param {number} pageSize - 每页数量，默认 10
 * @returns {Promise} 返回 Feed 数据
 */
export const getFeed = async (
  region = 'VN',
  device_id = '7214293347836528130',
  page = 1,
  pageSize = 10
) => {
  const feedOptions = {
    method: 'GET',
    url: 'https://tiktok-all-in-one.p.rapidapi.com/feed',
    params: {
      region,
      device_id,
      // 如果 API 支持分页参数，可以在这里添加
      // page,
      // page_size: pageSize,
    },
    headers: {
      'X-RapidAPI-Key': '4ad34b516cmsh9be8d0d889bb84cp1030f9jsn2446e27d5d3a',
      'X-RapidAPI-Host': 'tiktok-all-in-one.p.rapidapi.com',
    },
  };
  const data = await httpRequest.get(feedOptions);
  return data;
};

/**
 * 模拟分页获取 Feed 数据（用于本地测试）
 * 从 fakeFeedAPI 中分页返回数据
 * 支持循环加载：当加载完所有数据后，重新从第一页开始
 * @param {number} page - 页码，从 1 开始
 * @param {number} pageSize - 每页数量
 * @param {boolean} loop - 是否循环加载，默认 true
 * @returns {Promise<{data: Array, hasMore: boolean, total: number}>}
 */
export const getFeedPaginated = async (page = 1, pageSize = 10, loop = true) => {
  // 动态导入，避免在服务端执行时出错
  const fakeFeedAPI = await import('~/assets/json/fakeFeedAPI.json');
  const allData = fakeFeedAPI.default || fakeFeedAPI;
  const totalItems = allData.length;
  
  let startIndex, endIndex, paginatedData, hasMore;
  
  if (loop) {
    // 循环模式：使用模运算实现循环
    const actualIndex = ((page - 1) * pageSize) % totalItems;
    startIndex = actualIndex;
    endIndex = actualIndex + pageSize;
    
    if (endIndex <= totalItems) {
      // 不需要循环，直接切片
      paginatedData = allData.slice(startIndex, endIndex);
    } else {
      // 需要循环：先取到末尾，再从开头取剩余部分
      const firstPart = allData.slice(startIndex);
      const remaining = endIndex - totalItems;
      const secondPart = allData.slice(0, remaining);
      paginatedData = [...firstPart, ...secondPart];
    }
    
    // 循环模式下，始终有更多数据
    hasMore = true;
  } else {
    // 非循环模式：正常分页
    startIndex = (page - 1) * pageSize;
    endIndex = startIndex + pageSize;
    paginatedData = allData.slice(startIndex, endIndex);
    hasMore = endIndex < totalItems;
  }

  // 模拟网络延迟
  await new Promise((resolve) => setTimeout(resolve, 500));

  return {
    data: paginatedData,
    hasMore,
    total: totalItems,
    page,
    pageSize,
  };
};
