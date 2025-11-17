import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { appRoutes } from './routes/appRoutes';
import './assets/css/App.css';

const router = createBrowserRouter(appRoutes);

const App = () => {
  return <RouterProvider router={router} />;
};

export default App;
