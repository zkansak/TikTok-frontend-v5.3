import PropTypes from 'prop-types';
import { useLocation } from 'react-router-dom';
import classNames from 'classnames/bind';

import styles from './DefaultLayout.module.scss';
import Header from '~/layouts/components/Header';
import Sidebar from '~/layouts/components/Sidebar';
import config from '~/config';

const cx = classNames.bind(styles);

function DefaultLayout({ children }) {
  const location = useLocation();
  const isExplorePage = location.pathname === config.routes.explore;
  
  return (
    <div className={cx('wrapper', { 'explore-layout': isExplorePage })}>
      <Header />
      <div className={cx('container')}>
        <div className={cx('sidebar')}>
          <Sidebar />
        </div>
        <div className={cx('content', { 'explore-content': isExplorePage })}>{children}</div>
      </div>
    </div>
  );
}

DefaultLayout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default DefaultLayout;
