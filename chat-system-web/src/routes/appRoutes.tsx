import type { RouteObject } from 'react-router-dom';

import ChatPage from '../pages/ChatPage';
import GlobalChatPage from '../pages/GlobalChatPage';
import LandingPage from '../pages/LandingPage';
import NotFoundPage from '../pages/NotFoundPage';
import RootLayout from './RootLayout';

const rootChildRoutes: RouteObject[] = [
  { index: true, element: <LandingPage /> },
  { path: 'chat', element: <ChatPage /> },
  { path: 'global-chat', element: <GlobalChatPage /> },
  { path: '*', element: <NotFoundPage /> },
];

const rootRoute: RouteObject = {
  path: '/',
  element: <RootLayout />,
  children: rootChildRoutes,
};

export const appRoutes: RouteObject[] = [rootRoute];
