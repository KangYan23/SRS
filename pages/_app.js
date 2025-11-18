// 21st-extension toolbar integration
import { initToolbar } from '@21st-extension/toolbar';

import "@/styles/globals.css";

const stagewiseConfig = {
  plugins: [],
};

function setupStagewise() {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    initToolbar(stagewiseConfig);
  }
}

setupStagewise();

export default function App({ Component, pageProps }) {
  return <div><Component {...pageProps} /></div>;
}
