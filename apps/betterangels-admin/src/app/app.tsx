import { Route, Routes } from 'react-router-dom';
import { AppLayout } from './Layout/AppLayout';
import SignIn from './pages/sign-in';
import { routeChildren } from './routes/appRoutes';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        {routeChildren.map((route) => (
          <Route key={route.path} path={route.path} element={route.element} />
        ))}
      </Route>

      <Route>
        <Route path="/sign-in" element={<SignIn />} />
      </Route>
    </Routes>
  );
}

export default App;
