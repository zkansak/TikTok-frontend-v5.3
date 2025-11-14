import classNames from 'classnames/bind';
import styles from './Loading.module.scss';

const cx = classNames.bind(styles);

function Loading() {
  return (
    <div className={cx('wrapper')}>
      <div className={cx('spinner')}>
        <div className={cx('spinner-circle')}></div>
        <div className={cx('spinner-circle')}></div>
        <div className={cx('spinner-circle')}></div>
      </div>
      <p className={cx('text')}>Loading...</p>
    </div>
  );
}

export default Loading;







