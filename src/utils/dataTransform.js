// 通用的数据转换工具函数

/**
 * 检测是否为非拉丁字符
 * 检测不在 ASCII 可打印字符范围内的字符（排除控制字符）
 */
const isNonLatin = (text) => /[^\x20-\x7E]/.test(text || '');

/**
 * 从数组中随机选择一个元素
 */
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// 英文名称池
const enNames = [
  'Alex Carter',
  'Mia Johnson',
  'Ethan Walker',
  'Liam Brooks',
  'Ava Thompson',
  'Noah Davis',
  'Emily Clarke',
  'James Miller',
  'Sophia Turner',
  'Olivia Bennett',
];

// 俄文名称池
const ruNames = [
  'Анна Петрова',
  'Иван Смирнов',
  'Дарья Иванова',
  'Алексей Кузнецов',
  'София Волкова',
  'Никита Орлов',
  'Мария Соколова',
  'Даниил Морозов',
];

// 英文简介池
const enBios = [
  'Business inquiries: contact via bio link',
  'Creator | Daily vibes and travel',
  'Food lover. New videos every week',
  'Music and lifestyle. Collabs DM',
  'Sharing moments | Opinions my own',
];

// 俄文简介池
const ruBios = [
  'Контакты для сотрудничества — в профиле',
  'Музыка и лайфстайл. Пишите в ДМ',
  'Новые видео каждую неделю',
  'Обзоры, влоги, позитив',
];

// 英文标题池
const enCaptions = [
  '#trending #foryou #vibes',
  'Coffee break hits different today ☕️ #fyp',
  'Dance with us! #dance #viral',
  'POV: weekend mood activated ✨',
  'Quick recipe you need to try 👇 #food',
];

// 俄文标题池
const ruCaptions = [
  'Настроение на выходные ✨ #fyp',
  'Кофе и хорошие новости ☕️',
  'Трендовый звук — пробуем вместе',
  'Лайфхак, который ты искал(а) 👇',
  'Поделись с другом! #рекомендации',
];

/**
 * 根据用户ID生成唯一的头像URL
 * 使用 pravatar.cc 服务，基于用户ID生成一致的头像
 * @param {string} userId - 用户ID（uid 或 unique_id）
 * @returns {string} 头像URL
 */
export const generateAvatarUrl = (userId) => {
  if (!userId) return 'https://i.pravatar.cc/150?img=1';
  
  // 将用户ID转换为数字种子（确保相同ID生成相同头像）
  let seed = 0;
  for (let i = 0; i < userId.length; i++) {
    seed = ((seed << 5) - seed) + userId.charCodeAt(i);
    seed = seed & seed; // 转换为32位整数
  }
  
  // 使用种子生成1-70之间的头像编号（pravatar.cc支持1-70）
  const avatarIndex = Math.abs(seed) % 70 + 1;
  
  return `https://i.pravatar.cc/150?img=${avatarIndex}`;
};

/**
 * 转换视频数据，将非拉丁字符替换为英文或俄文
 * @param {Object} item - 原始视频数据
 * @returns {Object} 转换后的视频数据
 */
export const transformVideoData = (item) => {
  const author = { ...(item.author || {}) };
  const useRu = Math.random() < 0.4; // 混合一部分俄语

  if (isNonLatin(author.nickname)) {
    author.nickname = useRu ? pick(ruNames) : pick(enNames);
  }
  if (isNonLatin(author.signature)) {
    author.signature = useRu ? pick(ruBios) : pick(enBios);
  }

  // 生成基于用户ID的唯一头像
  const userId = author.uid || author.unique_id || '';
  const generatedAvatarUrl = generateAvatarUrl(userId);
  
  // 替换头像URL为生成的头像
  if (author.avatar_thumb) {
    author.avatar_thumb = {
      ...author.avatar_thumb,
      url_list: [generatedAvatarUrl],
    };
  } else {
    author.avatar_thumb = {
      url_list: [generatedAvatarUrl],
    };
  }

  const music = { ...(item.music || {}) };
  if (isNonLatin(music.title)) {
    music.title = 'original sound';
  }

  let desc = item.desc || '';
  if (isNonLatin(desc) || /#xuhuong|#ancungtiktok|#viet|#ChiYeuMinhAnh/i.test(desc)) {
    desc = useRu ? pick(ruCaptions) : pick(enCaptions);
  }

  return {
    ...item,
    author,
    music,
    desc,
  };
};

/**
 * 批量转换视频数据
 * @param {Array} data - 原始数据数组
 * @param {Function} transformFn - 转换函数，默认为 transformVideoData
 * @returns {Array} 转换后的数据数组
 */
export const transformVideoList = (data, transformFn = transformVideoData) => {
  if (!Array.isArray(data)) {
    return [];
  }
  return data.map(transformFn);
};

