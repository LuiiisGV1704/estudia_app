import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

import { Icon } from '../ui/Icon';

import { BottomNav } from './BottomNav';
import { SessionBar } from './SessionBar';

const titles: Record<string, string> = {
  '/': 'Inicio',
  '/biblioteca': 'Biblioteca',
  '/tarjetas': 'Tarjetas',
  '/agenda': 'Agenda',
  '/grupos': 'Grupos',
};

export function TabLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const title = titles[pathname] ?? 'Estudia';

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="min-h-dvh bg-surface">
      <header className="safe-top fixed inset-x-0 top-0 z-50 bg-surface/85 shadow-soft backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[560px] items-center justify-between px-margin">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-primary" />
            <h1 className="font-headline-md text-headline-md text-on-surface">{title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Buscar"
              onClick={() => navigate('/buscar')}
              className="flex h-11 w-11 items-center justify-center rounded-full text-secondary transition-colors hover:text-on-surface"
            >
              <Icon name="search" size={22} />
            </button>
            <button
              type="button"
              aria-label="Abrir ajustes"
              onClick={() => navigate('/ajustes')}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-on-primary"
            >
              <Icon name="person" size={18} fill />
            </button>
          </div>
        </div>
      </header>

      <main
        className="mx-auto w-full max-w-[560px] px-margin"
        style={{
          paddingTop: 'calc(4.5rem + env(safe-area-inset-top, 0px))',
          paddingBottom: 'calc(9rem + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <Outlet />
      </main>

      <SessionBar />
      <BottomNav />
    </div>
  );
}
