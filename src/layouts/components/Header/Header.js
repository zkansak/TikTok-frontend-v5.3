import { useState, useRef, useEffect } from 'react';
import classNames from 'classnames/bind';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import { Link, useLocation } from 'react-router-dom';

import styles from './Header.module.scss';
import images from '~/assets/images';
import Button from '~/components/Button';
import Menu from '~/layouts/components/Popper/Menu';
import config from '~/config';

import {
  DarkModeIcon,
  FeedbackIcon,
  GetCoinIcon,
  InboxIcon,
  KeyboardIcon,
  LanguageIcon,
  LogoutIcon,
  MessagesIcon,
  MoreIcon,
  ProfileIcon,
  SettingsIcon,
  UploadIcon,
} from '~/components/Icons';
import Image from '~/components/Image';
import Search from '../Search';

const cx = classNames.bind(styles);

// 分类数据
const initialCategories = [
  { id: 'all', label: 'All', active: true },
  { id: 'trending', label: 'Trending', active: false },
  { id: 'music', label: 'Music', active: false },
  { id: 'dance', label: 'Dance', active: false },
  { id: 'comedy', label: 'Comedy', active: false },
  { id: 'food', label: 'Food', active: false },
  { id: 'travel', label: 'Travel', active: false },
  { id: 'fashion', label: 'Fashion', active: false },
  { id: 'sports', label: 'Sports', active: false },
  { id: 'gaming', label: 'Gaming', active: false },
  { id: 'daily', label: 'Daily Life', active: false },
  { id: 'beauty', label: 'Beauty Care', active: false },
  { id: 'society', label: 'Society', active: false },
  { id: 'outfits', label: 'Outfits', active: false },
  { id: 'cars', label: 'Cars', active: false },
  { id: 'animals', label: 'Animals', active: false },
  { id: 'family', label: 'Family', active: false },
  { id: 'drama', label: 'Drama', active: false },
  { id: 'fitness', label: 'Fitness & Health', active: false },
];

const MENU_ITEMS = [
  {
    title: 'English',
    icon: <LanguageIcon />,
    children: {
      type: 'language',
      title: 'Language',
      items: [
        {
          code: 'en',
          title: 'English',
        },
        {
          title: 'العربية',
        },
        {
          title: 'বাঙ্গালি (ভারত)',
        },
        {
          title: 'Cebuano (Pilipinas)',
        },
        {
          title: 'Čeština (Česká republika)',
        },
        {
          title: 'Deutsch',
        },
        {
          title: 'Ελληνικά (Ελλάδα)',
        },
        {
          title: 'Español',
        },
        {
          title: 'Suomi (Suomi)',
        },
        {
          title: 'Filipino (Pilipinas)',
        },
        {
          title: 'Français',
        },
        {
          title: 'עברית (ישראל)',
        },
        {
          title: 'हिंदी',
        },
        {
          title: 'Magyar (Magyarország)',
        },
        {
          title: 'Bahasa Indonesia (Indonesia)',
        },
        {
          title: 'Italiano (Italia)',
        },
        {
          title: '日本語（日本）',
        },
        {
          title: 'Basa Jawa (Indonesia)',
        },
        {
          title: 'ខ្មែរ (កម្ពុជា)',
        },
        {
          title: '한국어 (대한민국)',
        },
        {
          title: 'Bahasa Melayu (Malaysia)',
        },
        {
          title: 'မြန်မာ (မြန်မာ)',
        },
        {
          title: 'Nederlands (Nederland)',
        },
        {
          title: 'Polski (Polska)',
        },
        {
          title: 'Português (Brasil)',
        },
        {
          title: 'Română (Romania)',
        },
        {
          title: 'Русский (Россия)',
        },
        {
          title: 'Svenska (Sverige)',
        },
        {
          title: 'ไทย (ไทย)',
        },
        {
          title: 'Türkçe (Türkiye)',
        },
        {
          title: 'Українська (Україна)',
        },
        {
          title: 'اردو',
        },
        {
          code: 'vi',
          title: 'Tiếng Việt (Việt Nam)',
        },
        {
          title: '简体中文',
        },
        {
          title: '繁體中文',
        },
      ],
    },
  },
  {
    title: 'Feedback and help',
    icon: <FeedbackIcon />,
    to: './feedback',
  },
  {
    title: 'Keyboard shortcuts',
    icon: <KeyboardIcon />,
  },
  {
    title: 'Dark mode',
    icon: <DarkModeIcon />,
  },
];

function Header() {
  const location = useLocation();
  const isExplorePage = location.pathname === config.routes.explore;
  
  const [userLogin, setUserLogin] = useState(true);
  const [categories, setCategories] = useState(initialCategories);
  const [draggedItem, setDraggedItem] = useState(null);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const categoryScrollRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  // 检查滚动位置，显示/隐藏箭头
  const checkScrollButtons = () => {
    if (categoryScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = categoryScrollRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    if (!isExplorePage) return;
    
    checkScrollButtons();
    const scrollContainer = categoryScrollRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', checkScrollButtons);
      window.addEventListener('resize', checkScrollButtons);
      return () => {
        scrollContainer.removeEventListener('scroll', checkScrollButtons);
        window.removeEventListener('resize', checkScrollButtons);
      };
    }
  }, [isExplorePage]);

  // 滚动时显示/隐藏导航栏（仅 Explore 页面）
  useEffect(() => {
    if (!isExplorePage) return;
    
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const headerHeight = 60;
          
          if (currentScrollY < headerHeight + 10) {
            setIsNavVisible(true);
          } else if (currentScrollY > lastScrollY && currentScrollY > headerHeight + 50) {
            // 向下滚动，向左移动消失
            setIsNavVisible(false);
          } else if (currentScrollY < lastScrollY) {
            // 向上滚动，重新出现
            setIsNavVisible(true);
          }
          
          setLastScrollY(currentScrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, isExplorePage]);

  // 滚动分类栏
  const scrollCategories = (direction) => {
    if (categoryScrollRef.current) {
      const scrollAmount = 200;
      const currentScroll = categoryScrollRef.current.scrollLeft;
      const newScroll = direction === 'left' 
        ? currentScroll - scrollAmount 
        : currentScroll + scrollAmount;
      categoryScrollRef.current.scrollTo({
        left: newScroll,
        behavior: 'smooth',
      });
    }
  };

  // 处理分类点击
  const handleCategoryClick = (categoryId) => {
    setCategories((prev) =>
      prev.map((cat) => ({
        ...cat,
        active: cat.id === categoryId,
      }))
    );
  };

  // 拖动处理
  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
    if (e.target) {
      e.target.style.opacity = '0.5';
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    return false;
  };

  const handleDragEnd = (e) => {
    if (e.target) {
      e.target.style.opacity = '1';
    }
    setDraggedItem(null);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (draggedItem === null || draggedItem === dropIndex) {
      setDraggedItem(null);
      return;
    }

    const newCategories = [...categories];
    const draggedCategory = newCategories[draggedItem];
    newCategories.splice(draggedItem, 1);
    newCategories.splice(dropIndex, 0, draggedCategory);
    setCategories(newCategories);
    setDraggedItem(null);
    
    return false;
  };

  const userMenu = [
    {
      title: 'View profile',
      icon: <ProfileIcon />,
      to: './@profile',
    },
    {
      title: 'Get Coins',
      icon: <GetCoinIcon />,
      to: './coins',
    },
    {
      title: 'Settings',
      icon: <SettingsIcon />,
      to: './settings',
    },
    ...MENU_ITEMS,
    {
      title: 'Log out',
      icon: <LogoutIcon />,
      separate: true,
    },
  ];

  const handleMenuChange = (menuItem) => {
    console.log(menuItem);
    switch (menuItem.title) {
      case 'Log out':
        setUserLogin(false);
        break;
      default:
        break;
    }
  };

  return (
    <header className={cx('wrapper')}>
      <div className={cx('inner')}>
        <div className={cx('header-left')}>
          <Link className={cx('logo-container')} to={config.routes.home}>
            <Image src={images.logo} alt="Tiktok" />
          </Link>
        </div>

        {/* 中间区域：统一布局，Explore 页面使用大盒子 */}
        {isExplorePage ? (
          <div className={cx('header-center', 'explore-center-box', { visible: isNavVisible, hidden: !isNavVisible })}>
            <div className={cx('explore-box-content')}>
              <div className={cx('search-container', 'explore-search')}>
                <Search />
              </div>
              <div className={cx('category-nav-wrapper')}>
                {showLeftArrow && (
                  <button
                    className={cx('scroll-btn', 'scroll-left')}
                    onClick={() => scrollCategories('left')}
                    aria-label="Scroll left"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
                    </svg>
                  </button>
                )}
                <div
                  ref={categoryScrollRef}
                  className={cx('category-nav-scroll')}
                >
                  <div className={cx('category-nav-list')}>
                    {categories.map((category, index) => (
                      <div
                        key={category.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={handleDragOver}
                        onDragEnter={handleDragEnter}
                        onDragEnd={handleDragEnd}
                        onDrop={(e) => handleDrop(e, index)}
                        className={cx('category-item', {
                          active: category.active,
                          dragging: draggedItem === index,
                        })}
                        onClick={() => handleCategoryClick(category.id)}
                      >
                        {category.label}
                      </div>
                    ))}
                  </div>
                </div>
                {showRightArrow && (
                  <button
                    className={cx('scroll-btn', 'scroll-right')}
                    onClick={() => scrollCategories('right')}
                    aria-label="Scroll right"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className={cx('header-center', 'search-center')}>
            <Search />
          </div>
        )}

        <div className={cx('action')}>
          <Button leftIcon={<UploadIcon />} basic to={config.routes.upload}>
            <span className={cx('upload-span')}>Upload</span>
          </Button>
          {userLogin ? (
            <>
              <Tippy content="Messages" placement="bottom">
                <button className={cx('action-btn', 'messages-icon')}>
                  <MessagesIcon width="2.6rem" height="2.6rem" />
                </button>
              </Tippy>
              <Tippy content="Inbox" placement="bottom">
                <button className={cx('action-btn')}>
                  <span>
                    <InboxIcon />
                  </span>
                  <sup className={cx('badge')}>1</sup>
                </button>
              </Tippy>
            </>
          ) : (
            <>
              <Button primary onClick={() => setUserLogin(true)}>
                Log in
              </Button>
            </>
          )}

          <Menu items={userLogin ? userMenu : MENU_ITEMS} onChange={handleMenuChange}>
            {userLogin ? (
              <Image
                className={cx('user-ava')}
                src="https://i.pravatar.cc/150?img=8"
                alt="user-avatar"
                fallback={require('~/assets/images/no-avatar.jpeg')}
              />
            ) : (
              <button className={cx('more-icon')}>
                <MoreIcon />
              </button>
            )}
          </Menu>
        </div>
      </div>
    </header>
  );
}

export default Header;
