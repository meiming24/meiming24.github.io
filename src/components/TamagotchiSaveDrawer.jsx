function CloseIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}

function SlotIcon({ hasData }) {
  if (hasData) {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" strokeLinejoin="round" />
        <path d="M17 21v-8H7v8" strokeLinejoin="round" />
        <path d="M7 3v5h8" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="4 3" />
      <path d="M12 8v8M8 12h8" strokeLinecap="round" />
    </svg>
  );
}

function formatDate(ts) {
  if (!ts) return null;
  return new Date(ts).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function TamagotchiSaveDrawer({ open, mode, slotsInfo, onSave, onLoad, onClose }) {
  const isSave = mode === 'save';

  return (
    <>
      <button
        type="button"
        className={`tamagotchi-skin-backdrop${open ? ' tamagotchi-skin-backdrop--open' : ''}`}
        aria-label="Close save menu"
        tabIndex={open ? 0 : -1}
        onClick={onClose}
      />

      <aside
        className={`tamagotchi-save-drawer${open ? ' tamagotchi-save-drawer--open' : ''}`}
        aria-hidden={!open}
        aria-label={isSave ? 'Save game' : 'Load game'}
      >
        <header className="tamagotchi-save-drawer__head">
          <div>
            <p className="tamagotchi-save-drawer__eyebrow">{isSave ? 'Save to slot' : 'Load from slot'}</p>
            <h2 className="tamagotchi-save-drawer__title">{isSave ? 'Save game' : 'Load game'}</h2>
          </div>
          <button type="button" className="tamagotchi-save-drawer__close" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </header>

        <div className="tamagotchi-save-drawer__slots">
          {slotsInfo.map((slot) => {
            const disabled = !isSave && !slot.hasData;
            return (
              <button
                key={slot.index}
                type="button"
                className={`tamagotchi-slot-card${slot.hasData ? ' tamagotchi-slot-card--filled' : ''}`}
                disabled={disabled}
                onClick={() => isSave ? onSave(slot.index) : onLoad(slot.index)}
              >
                <span className="tamagotchi-slot-card__icon">
                  <SlotIcon hasData={slot.hasData} />
                </span>
                <span className="tamagotchi-slot-card__body">
                  <span className="tamagotchi-slot-card__name">Slot {slot.index}</span>
                  <span className="tamagotchi-slot-card__desc">
                    {slot.hasData ? formatDate(slot.savedAt) : 'Empty'}
                  </span>
                </span>
                <span className="tamagotchi-slot-card__action">
                  {isSave ? (slot.hasData ? 'Overwrite' : 'Save') : 'Load'}
                </span>
              </button>
            );
          })}
        </div>
      </aside>
    </>
  );
}
