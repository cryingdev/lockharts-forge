import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

/**
 * document.fonts.ready를 사용하여 모든 외부 폰트(Google Fonts 등)가 
 * 완전히 로드된 것을 보장한 뒤 React 앱을 마운트합니다.
 * 이를 통해 인트로 화면의 'CryingDev Studio' 텍스트가 
 * 기본 폰트로 먼저 그려지는 현상을 방지할 수 있습니다.
 */
document.fonts.ready.then(() => {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
