// 21st-extension toolbar integration
import { initToolbar } from '@21st-extension/toolbar';

const stagewiseConfig = {
  plugins: [],
};

function setupStagewise() {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    initToolbar(stagewiseConfig);
  }
}

setupStagewise();
import "@/styles/globals.css";

export default function App({ Component, pageProps }) {
  return <Component {...pageProps} />;
}
