import { Fragment, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { publicRoutes } from '~/routes';
import DefaultLayout from '~/layouts';
import Loading from '~/components/Loading';
import { saveScrollPosition, getScrollPosition } from '~/utils/scrollPosition';

// 滚动位置恢复组件
function ScrollRestoration() {
  const location = useLocation();

  useEffect(() => {
    // 恢复滚动位置
    const savedPosition = getScrollPosition(location.pathname);
    if (savedPosition > 0) {
      window.scrollTo(0, savedPosition);
    } else {
      window.scrollTo(0, 0);
    }

    // 监听滚动，保存位置
    const handleScroll = () => {
      saveScrollPosition(location.pathname, window.scrollY);
    };

    // 防抖处理
    let scrollTimer;
    const throttledHandleScroll = () => {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(handleScroll, 100);
    };

    window.addEventListener('scroll', throttledHandleScroll, { passive: true });

    return () => {
      clearTimeout(scrollTimer);
      window.removeEventListener('scroll', throttledHandleScroll);
    };
  }, [location.pathname]);

  return null;
}

function App() {
  return (
    <Router>
      <div className="App">
        <ScrollRestoration />
        <Suspense fallback={<Loading />}>
          <Routes>
            {publicRoutes.map((route, index) => {
              const Layout = route.layout ? route.layout : route.layout === null ? Fragment : DefaultLayout;
              const Pages = route.component;
              return (
                <Route
                  key={index}
                  path={route.path}
                  element={
                    <Layout>
                      <Pages />
                    </Layout>
                  }
                ></Route>
              );
            })}
          </Routes>
        </Suspense>
      </div>
    </Router>
  );
}

export default App;
