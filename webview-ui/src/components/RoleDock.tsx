import { roleDefinitions } from '../roles.js';

interface RoleDockProps {
  activeRoleIds: Set<string>;
}

export function RoleDock({ activeRoleIds }: RoleDockProps) {
  return (
    <div className="role-dock-shell absolute left-1/2 bottom-210 -translate-x-1/2 z-20 px-8 py-6 bg-bg border-2 border-border shadow-pixel flex gap-8 overflow-x-auto overscroll-x-contain">
      {roleDefinitions.map((role) => {
        const active = activeRoleIds.has(role.id);
        return (
          <button
            key={role.id}
            type="button"
            draggable={!active}
            onDragStart={(event) => {
              event.dataTransfer.setData('application/x-pixel-role', role.id);
              event.dataTransfer.effectAllowed = 'copy';
            }}
            disabled={active}
            title={active ? `${role.name} is in the room` : `Drag ${role.name} into the room`}
            className={`min-w-86 h-72 border-2 shadow-pixel flex flex-col items-center justify-center gap-3 select-none ${
              active
                ? 'bg-active-bg border-accent text-text-muted opacity-70 cursor-default'
                : 'bg-btn-bg border-border text-text cursor-grab hover:bg-btn-hover'
            }`}
          >
            <span
              className="w-24 h-48 block"
              style={{
                imageRendering: 'pixelated',
                backgroundImage: `url('/assets/characters/char_${role.palette}.png')`,
                backgroundPosition: '0 0',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '168px 144px',
              }}
            />
            <span className="text-[14px] leading-none whitespace-nowrap">{role.name}</span>
          </button>
        );
      })}
    </div>
  );
}
