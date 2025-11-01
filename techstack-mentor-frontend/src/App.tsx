import { useEffect } from 'react';
import { useStore } from './store/useStore';
import { Home } from './pages/Home';
import { Interview } from './pages/Interview';
import { Results } from './pages/Results';
import { Suggestions } from './pages/Suggestions';

function App() {
  const { currentView, userId, setUserId } = useStore();

  useEffect(() => {
    // Generate user ID if not exists
    if (!userId) {
      const newUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setUserId(newUserId);
    }
  }, []);

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <Home />;
      case 'interview':
        return <Interview />;
      case 'results':
        return <Results />;
      case 'suggestions':
        return <Suggestions />;
      default:
        return <Home />;
    }
  };

  return <div className="app">{renderView()}</div>;
}

export default App;
