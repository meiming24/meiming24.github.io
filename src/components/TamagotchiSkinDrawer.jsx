function CloseIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}

export default function TamagotchiSkinDrawer({ open, skins, activeSkinId, onSelect, onClose }) {
  return (
    <>
      <button
        type="button"
        className={`tamagotchi-skin-backdrop${open ? ' tamagotchi-skin-backdrop--open' : ''}`}
        aria-label="Close skin picker"
        tabIndex={open ? 0 : -1}
        onClick={onClose}
      />

      <aside
        className={`tamagotchi-skin-drawer${open ? ' tamagotchi-skin-drawer--open' : ''}`}
        aria-hidden={!open}
        aria-label="Shell skins"
      >
        <header className="tamagotchi-skin-drawer__head">
          <div>
            <p className="tamagotchi-skin-drawer__eyebrow">Customize</p>
            <h2 className="tamagotchi-skin-drawer__title">Shell skins</h2>
          </div>
          <button type="button" className="tamagotchi-skin-drawer__close" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </header>

        <div className="tamagotchi-skin-drawer__track" role="list">
          {skins.map((skin) => {
            const active = skin.id === activeSkinId;
            return (
              <button
                key={skin.id}
                type="button"
                role="listitem"
                className={`tamagotchi-skin-card${active ? ' tamagotchi-skin-card--active' : ''}`}
                aria-pressed={active}
                onClick={() => onSelect(skin.id)}
              >
                <span className="tamagotchi-skin-card__preview">
                  <img src={skin.previewUrl} alt="" />
                </span>
                <span className="tamagotchi-skin-card__meta">
                  <span className="tamagotchi-skin-card__name">{skin.name}</span>
                  <span className="tamagotchi-skin-card__desc">{skin.description}</span>
                </span>
                {active ? <span className="tamagotchi-skin-card__badge">Active</span> : null}
              </button>
            );
          })}
        </div>
      </aside>
    </>
  );
}
