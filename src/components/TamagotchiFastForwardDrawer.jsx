import { useState } from 'react';

export default function TamagotchiFastForwardDrawer({
  open,
  fastForwarding,
  ffProgress,
  onStart,
  onCancel,
  onClose,
}) {
  const [hours, setHours] = useState('0');
  const [minutes, setMinutes] = useState('30');

  const h = Math.min(23, Math.max(0, parseInt(hours) || 0));
  const m = Math.min(59, Math.max(0, parseInt(minutes) || 0));
  const totalMinutes = h * 60 + m;
  const pct = Math.round(ffProgress * 100);

  const handleHours = (e) => {
    const v = e.target.value.replace(/\D/g, '').slice(0, 2);
    setHours(v);
  };

  const handleMinutes = (e) => {
    const v = e.target.value.replace(/\D/g, '').slice(0, 2);
    setMinutes(v);
  };

  const handleBlurHours = () => {
    setHours(String(Math.min(23, Math.max(0, parseInt(hours) || 0))));
  };

  const handleBlurMinutes = () => {
    setMinutes(String(Math.min(59, Math.max(0, parseInt(minutes) || 0))));
  };

  return (
    <>
      <button
        type="button"
        className={`tamagotchi-skin-backdrop${open ? ' tamagotchi-skin-backdrop--open' : ''}`}
        aria-label="Close fast forward"
        tabIndex={open ? 0 : -1}
        onClick={onClose}
      />

      <aside
        className={`tamagotchi-ff-drawer${open ? ' tamagotchi-ff-drawer--open' : ''}`}
        aria-hidden={!open}
        aria-label="Fast forward time"
      >
        <header className="tamagotchi-ff-drawer__head">
          <div>
            <p className="tamagotchi-ff-drawer__eyebrow">Controls</p>
            <h2 className="tamagotchi-ff-drawer__title">Fast Forward</h2>
          </div>
          <button
            type="button"
            className="tamagotchi-ff-drawer__close"
            onClick={onClose}
            aria-label="Close"
            disabled={fastForwarding}
          >
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        {fastForwarding ? (
          <div className="tamagotchi-ff-progress">
            <p className="tamagotchi-ff-progress__label">Skipping time…</p>
            <div className="tamagotchi-ff-progress__track">
              <div className="tamagotchi-ff-progress__fill" style={{ width: `${pct}%` }} />
            </div>
            <p className="tamagotchi-ff-progress__pct">{pct}%</p>
            <button type="button" className="tamagotchi-ff-cancel" onClick={onCancel}>Cancel</button>
          </div>
        ) : (
          <div className="tamagotchi-ff-form">
            <p className="tamagotchi-ff-form__desc">How much game time to skip?</p>
            <div className="tamagotchi-ff-form__fields">
              <label className="tamagotchi-ff-field">
                <span className="tamagotchi-ff-field__label">Hours <span className="tamagotchi-ff-field__hint">0 – 23</span></span>
                <input
                  className="tamagotchi-ff-field__input"
                  inputMode="numeric"
                  value={hours}
                  onChange={handleHours}
                  onBlur={handleBlurHours}
                  placeholder="0"
                />
              </label>
              <label className="tamagotchi-ff-field">
                <span className="tamagotchi-ff-field__label">Minutes <span className="tamagotchi-ff-field__hint">0 – 59</span></span>
                <input
                  className="tamagotchi-ff-field__input"
                  inputMode="numeric"
                  value={minutes}
                  onChange={handleMinutes}
                  onBlur={handleBlurMinutes}
                  placeholder="0"
                />
              </label>
            </div>
            <button
              type="button"
              className="tamagotchi-ff-submit"
              disabled={totalMinutes === 0}
              onClick={() => onStart(h, m)}
            >
              Start
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
