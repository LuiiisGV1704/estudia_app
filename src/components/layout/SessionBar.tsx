import { useNavigate } from 'react-router-dom';

import { formatTimer } from '../../lib/date';
import { getSubject } from '../../lib/selectors';
import { useApp } from '../../state/AppProvider';
import { useSession } from '../../state/SessionProvider';
import { Icon } from '../ui/Icon';

export function SessionBar() {
  const { session, toggle } = useSession();
  const { data } = useApp();
  const navigate = useNavigate();
  if (!session.active) return null;

  const subject = getSubject(data.subjects, session.subjectId);
  const elapsed = session.total > 0 ? ((session.total - session.remaining) / session.total) * 100 : 0;
  const label = session.kind === 'break' ? 'Descanso' : subject.name;

  return (
    <aside
      className="fixed left-margin right-margin z-40 mx-auto max-w-[350px]"
      style={{ bottom: 'calc(74px + env(safe-area-inset-bottom, 0px))' }}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => navigate('/enfoque')}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') navigate('/enfoque');
        }}
        className="relative flex h-10 cursor-pointer items-center justify-between overflow-hidden rounded-full bg-primary px-4 text-on-primary shadow-float transition-transform active:scale-[0.99]"
      >
        <div
          className="absolute inset-y-0 left-0 bg-on-primary/15 transition-[width] duration-500"
          style={{ width: `${Math.min(100, Math.max(0, elapsed))}%` }}
        />
        <div className="relative flex min-w-0 items-center gap-2">
          <Icon
            name={session.kind === 'break' ? 'coffee' : 'schedule'}
            size={16}
            className={session.running ? 'animate-soft-pulse' : ''}
          />
          <span className="truncate font-label-md text-[12px] font-medium tracking-wide">
            {formatTimer(session.remaining)} · {label}
          </span>
        </div>
        <button
          type="button"
          aria-label={session.running ? 'Pausar sesión' : 'Reanudar sesión'}
          onClick={(event) => {
            event.stopPropagation();
            toggle();
          }}
          className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full hover:bg-white/10"
        >
          <Icon name={session.running ? 'pause' : 'play_arrow'} size={16} fill />
        </button>
      </div>
    </aside>
  );
}
