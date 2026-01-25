
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initializeWebCache } from './utils/cacheManager';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

/**
 * 폰트 로드와 웹 캐시 정리가 모두 완료된 후 앱을 렌더링합니다.
 * 버전 불일치로 인한 오작동을 방지하고 최신 리소스를 보장합니다.
 */
Promise.all([
  document.fonts.ready,
  initializeWebCache()
]).then(() => {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}).catch(err => {
    console.error("Critical: Initialization failed", err);
    // 초기화에 실패하더라도 일단 렌더링을 시도합니다.
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
});
