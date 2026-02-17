import Nav from '../layouts/Nav';
import Loader from '../components/player/Loader';
import { useLocation, Navigate } from 'react-router-dom';

const Player = () => {
  const location = useLocation();
  const app = location.state?.app;

  //handling when directly nav to /docs/r/
  if (!app) {
    return <Navigate to="/docs" replace />;
  }

  return (
    <>
      <Nav />
      <div className="w-[min(1320px,95vw)] mx-auto flex flex-col gap-4 mt-4 mb-8">
        <Loader app={app} />
      </div>
    </>
  );
};

export default Player;
