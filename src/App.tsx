import { useEffect } from "react";
import { HomePage } from "./pages/HomePage";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { preloadFullScreenAd, initializeTossAds, cleanupFullScreenAd } from "./lib/adManager";
import "./styles/animations.css";

function App() {
  useEffect(() => {
    void initializeTossAds();
    void preloadFullScreenAd();

    return () => {
      cleanupFullScreenAd();
    };
  }, []);

  return (
    <ErrorBoundary>
      <HomePage />
    </ErrorBoundary>
  );
}

export default App;
