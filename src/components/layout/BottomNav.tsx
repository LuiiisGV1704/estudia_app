import { NavLink } from 'react-router-dom';

import { cn } from '../../lib/cn';
import { Icon } from '../ui/Icon';

const items = [
  { path: '/', label: 'Inicio', icon: 'home', end: true },
  { path: '/biblioteca', label: 'Biblioteca', icon: 'menu_book' },
  { path: '/tarjetas', label: 'Tarjetas', icon: 'style' },
  { path: '/agenda', label: 'Agenda', icon: 'calendar_today' },
  { path: '/grupos', label: 'Grupos', icon: 'group' },
];

export function BottomNav() {
  return (
    <nav
      aria-label="Navegación principal"
      className="safe-bottom fixed bottom-0 z-50 w-full bg-surface/90 shadow-soft backdrop-blur-xl"
    >
      <div className="mx-auto flex h-[68px] max-w-[430px] items-center justify-around px-2">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex min-h-[46px] min-w-[56px] flex-col items-center justify-center gap-1 transition-colors',
                isActive ? 'text-primary' : 'text-secondary',
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    'flex h-7 w-10 items-center justify-center rounded-full transition-colors',
                    isActive && 'bg-primary-fixed text-primary',
                  )}
                >
                  <Icon name={item.icon} size={22} fill={isActive} />
                </span>
                <span className={cn('font-caption text-[11px] leading-tight', isActive && 'font-medium')}>
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
