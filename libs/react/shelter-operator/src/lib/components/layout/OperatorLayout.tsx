import { Outlet } from 'react-router-dom';
import NavBar from '../NavBar';

export function OperatorLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
