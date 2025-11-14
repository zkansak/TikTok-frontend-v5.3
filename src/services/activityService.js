/**
 * 活动管理服务
 * 模拟活动数据的增删改查操作
 */

// 获取未来日期（用于测试）
const getFutureDate = (days = 30) => {
  const now = new Date();
  now.setDate(now.getDate() + days);
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 模拟活动数据（实际应该从API获取）
let mockActivities = [
  {
    id: 1,
    name: '春节大促活动',
    type: 'promotion',
    status: 'active',
    startDate: '2024-01-01', // 使用过去日期，确保当前可见
    endDate: getFutureDate(365), // 未来一年
    description: '春节期间的特别促销活动，包含多种优惠',
    resourceType: 'banner',
    resourceUrl: 'https://picsum.photos/1200/200?random=1', // 使用占位图片服务
    targetUrl: 'https://www.tiktok.com', // 改为外链，方便测试
    placement: 'home_top',
    displayRule: 'every_visit', // 改为每次访问都显示，方便测试
    priority: 1,
    createdAt: '2025-01-15T10:00:00Z',
  },
  {
    id: 2,
    name: '新用户注册奖励',
    type: 'reward',
    status: 'active',
    startDate: '2024-01-01', // 使用过去日期，确保当前可见
    endDate: getFutureDate(365), // 未来一年
    description: '新用户注册即可获得丰厚奖励',
    resourceType: 'popup',
    resourceUrl: 'https://picsum.photos/600/800?random=2', // 使用占位图片服务
    targetUrl: '/register',
    placement: 'home_center',
    displayRule: 'every_visit', // 改为每次访问都显示，方便测试
    priority: 2,
    createdAt: '2025-01-01T08:00:00Z',
  },
  {
    id: 3,
    name: '限时秒杀活动',
    type: 'flash_sale',
    status: 'active', // 改为 active，确保可见
    startDate: '2024-01-01', // 使用过去日期，确保当前可见
    endDate: getFutureDate(365), // 未来一年
    description: '限时秒杀，超值优惠',
    resourceType: 'banner',
    resourceUrl: 'https://picsum.photos/1200/200?random=3', // 使用占位图片服务
    targetUrl: 'https://www.google.com', // 改为外链，方便测试
    placement: 'home_bottom',
    displayRule: 'every_visit', // 改为每次访问都显示，方便测试
    priority: 3,
    createdAt: '2025-01-25T14:00:00Z',
  },
];

/**
 * 获取活动列表
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码
 * @param {number} params.pageSize - 每页数量
 * @param {string} params.status - 状态筛选
 * @param {string} params.keyword - 关键词搜索（活动名称、描述）
 * @returns {Promise<{data: Array, total: number, page: number, pageSize: number}>}
 */
export const getActivityList = async (params = {}) => {
  const { page = 1, pageSize = 10, status, keyword } = params;

  // 模拟网络延迟
  await new Promise((resolve) => setTimeout(resolve, 300));

  let filteredData = [...mockActivities];

  // 关键词搜索（活动名称、描述）
  if (keyword) {
    const lowerKeyword = keyword.toLowerCase();
    filteredData = filteredData.filter(
      (item) =>
        item.name.toLowerCase().includes(lowerKeyword) ||
        (item.description && item.description.toLowerCase().includes(lowerKeyword))
    );
  }

  // 状态筛选
  if (status) {
    filteredData = filteredData.filter((item) => item.status === status);
  }

  // 分页
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  return {
    data: paginatedData,
    total: filteredData.length,
    page,
    pageSize,
  };
};

/**
 * 获取单个活动详情
 * @param {number} id - 活动ID
 * @returns {Promise<Object>}
 */
export const getActivityById = async (id) => {
  await new Promise((resolve) => setTimeout(resolve, 200));

  const activity = mockActivities.find((item) => item.id === id);
  if (!activity) {
    throw new Error('活动不存在');
  }

  return activity;
};

/**
 * 创建活动
 * @param {Object} activityData - 活动数据
 * @returns {Promise<Object>}
 */
export const createActivity = async (activityData) => {
  await new Promise((resolve) => setTimeout(resolve, 500));

  const newActivity = {
    id: Date.now(), // 简单ID生成，实际应该由后端生成
    ...activityData,
    createdAt: new Date().toISOString(),
  };

  mockActivities.unshift(newActivity); // 添加到开头
  return newActivity;
};

/**
 * 更新活动
 * @param {number} id - 活动ID
 * @param {Object} activityData - 更新的活动数据
 * @returns {Promise<Object>}
 */
export const updateActivity = async (id, activityData) => {
  await new Promise((resolve) => setTimeout(resolve, 500));

  const index = mockActivities.findIndex((item) => item.id === id);
  if (index === -1) {
    throw new Error('活动不存在');
  }

  mockActivities[index] = {
    ...mockActivities[index],
    ...activityData,
  };

  return mockActivities[index];
};

/**
 * 删除活动
 * @param {number} id - 活动ID
 * @returns {Promise<boolean>}
 */
export const deleteActivity = async (id) => {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const index = mockActivities.findIndex((item) => item.id === id);
  if (index === -1) {
    throw new Error('活动不存在');
  }

  mockActivities.splice(index, 1);
  return true;
};

/**
 * 更新活动状态
 * @param {number} id - 活动ID
 * @param {string} status - 新状态
 * @returns {Promise<Object>}
 */
export const updateActivityStatus = async (id, status) => {
  return updateActivity(id, { status });
};

/**
 * 批量更新活动状态
 * @param {Array<number>} ids - 活动ID数组
 * @param {string} status - 新状态
 * @returns {Promise<boolean>}
 */
export const batchUpdateActivityStatus = async (ids, status) => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  ids.forEach((id) => {
    const index = mockActivities.findIndex((item) => item.id === id);
    if (index !== -1) {
      mockActivities[index].status = status;
    }
  });
  
  return true;
};

/**
 * 批量删除活动
 * @param {Array<number>} ids - 活动ID数组
 * @returns {Promise<boolean>}
 */
export const batchDeleteActivities = async (ids) => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  mockActivities = mockActivities.filter((item) => !ids.includes(item.id));
  
  return true;
};

/**
 * 获取活动统计信息
 * @returns {Promise<Object>}
 */
export const getActivityStats = async () => {
  await new Promise((resolve) => setTimeout(resolve, 100));
  
  const now = new Date().toISOString().split('T')[0];
  
  const stats = {
    total: mockActivities.length,
    active: mockActivities.filter((item) => item.status === 'active').length,
    inactive: mockActivities.filter((item) => item.status === 'inactive').length,
    ended: mockActivities.filter((item) => item.status === 'ended').length,
    running: mockActivities.filter((item) => {
      if (item.status !== 'active') return false;
      return item.startDate <= now && item.endDate >= now;
    }).length,
  };
  
  return stats;
};

/**
 * 获取指定位置的活动资源（用于前端展示）
 * @param {string} placement - 投放位置
 * @param {string} resourceType - 资源类型（可选）
 * @returns {Promise<Array>}
 */
export const getActiveResourcesByPlacement = async (placement, resourceType = null) => {
  // 移除模拟延迟，同步返回数据以最大化LCP性能
  // 在生产环境中，这里会是真实的API调用
  // await new Promise((resolve) => setTimeout(resolve, 0));

  const now = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  let filtered = mockActivities.filter((activity) => {
    // 只返回进行中的活动
    if (activity.status !== 'active') return false;

    // 检查时间范围
    if (activity.startDate > now || activity.endDate < now) return false;

    // 检查投放位置
    if (activity.placement !== placement) return false;

    // 检查资源类型（如果指定）
    if (resourceType && activity.resourceType !== resourceType) return false;

    return true;
  });

  // 按优先级排序
  filtered.sort((a, b) => a.priority - b.priority);

  return filtered;
};

