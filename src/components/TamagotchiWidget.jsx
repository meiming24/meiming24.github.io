import { useCallback, useEffect, useState } from 'react';

import { createPortal } from 'react-dom';

import { useTamagotchiEmulator } from '../hooks/useTamagotchiEmulator';

import { useTamagotchiSkin } from '../hooks/useTamagotchiSkin';

import TamagotchiScreen from './TamagotchiScreen';

import TamagotchiShellControls from './TamagotchiShellControls';

import TamagotchiPanelControls from './TamagotchiPanelControls';

import TamagotchiSkinDrawer from './TamagotchiSkinDrawer';
import TamagotchiSaveDrawer from './TamagotchiSaveDrawer';
import TamagotchiHints from './TamagotchiHints';
import { tamagotchiAudio, primeTamagotchiAudio } from '../tamagotchi/audio';



function LightboxCloseButton({ onClose, label }) {

  return (

    <button

      className="art-lightbox-close"

      type="button"

      onClick={(event) => {

        event.stopPropagation();

        onClose();

      }}

      aria-label={label}

    >

      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">

        <path

          d="M6 6l12 12M18 6L6 18"

          stroke="currentColor"

          strokeWidth="1.75"

          strokeLinecap="round"

        />

      </svg>

    </button>

  );

}



export default function TamagotchiWidget() {

  const [open, setOpen] = useState(false);

  const [skinsOpen, setSkinsOpen] = useState(false);
  const [saveDrawerMode, setSaveDrawerMode] = useState(null); // null | 'save' | 'load'

  const { skin, skinId, setSkinId, skins } = useTamagotchiSkin();

  const { screenRef, status, error, config, sendButton, tapButton, resetGame, togglePause, saveSlot, loadSlot, slotsInfo, isPaused } =

    useTamagotchiEmulator(open);

  const layout = skin.layout;

  const faceUrl = skin.shellUrl;

  const hasAnySaveSlot = slotsInfo.some((s) => s.hasData);

  const close = useCallback(() => {

    setSkinsOpen(false);
    setSaveDrawerMode(null);
    setOpen(false);

  }, []);

  const openWidget = useCallback(async () => {
    await tamagotchiAudio.ensureReady();
    setOpen(true);
  }, []);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const unlockAudio = () => {
      tamagotchiAudio.ensureReady().catch(() => {});
    };

    window.addEventListener('pointerdown', unlockAudio, { capture: true });
    unlockAudio();

    return () => {
      window.removeEventListener('pointerdown', unlockAudio, { capture: true });
    };
  }, [open]);

  useEffect(() => {
    if (isPaused) {
      tamagotchiAudio.stop();
    }
  }, [isPaused]);

  const handleOpenSave = useCallback(() => {
    setSkinsOpen(false);
    setSaveDrawerMode((m) => (m === 'save' ? null : 'save'));
  }, []);

  const handleOpenLoad = useCallback(() => {
    setSkinsOpen(false);
    setSaveDrawerMode((m) => (m === 'load' ? null : 'load'));
  }, []);

  const handleSaveToSlot = useCallback((slotIndex) => {
    saveSlot(slotIndex);
    setSaveDrawerMode(null);
  }, [saveSlot]);

  const handleLoadFromSlot = useCallback((slotIndex) => {
    loadSlot(slotIndex);
    setSaveDrawerMode(null);
  }, [loadSlot]);

  const pressButton = useCallback(

    (button) => {

      primeTamagotchiAudio();
      sendButton(button, true);

    },

    [sendButton],

  );



  const releaseButton = useCallback(

    (button) => {

      sendButton(button, false);

    },

    [sendButton],

  );



  useEffect(() => {

    if (!open) {

      return undefined;

    }



    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = 'hidden';



    const resolveButton = (event) => {

      if (config?.hotkeys) {

        for (const [button, keyCode] of Object.entries(config.hotkeys)) {

          if (event.keyCode === keyCode) {

            return button;

          }

        }

      }



      const arrows = { ArrowLeft: 'A', ArrowDown: 'B', ArrowRight: 'C' };

      return arrows[event.key] ?? null;

    };



    const handleKeyDown = (event) => {

      if (event.key === 'Escape') {

        if (saveDrawerMode) {
          setSaveDrawerMode(null);
          return;
        }

        if (skinsOpen) {

          setSkinsOpen(false);

          return;

        }

        close();

        return;

      }



      if (event.repeat || (status !== 'running' && status !== 'paused')) {

        return;

      }



      if (isPaused) {

        return;

      }



      const button = resolveButton(event);

      if (button) {

        event.preventDefault();

        tapButton(button);

      }

    };



    const handleKeyUp = (event) => {

      const button = resolveButton(event);

      if (button) {

        event.preventDefault();

      }

    };



    window.addEventListener('keydown', handleKeyDown);

    window.addEventListener('keyup', handleKeyUp);



    return () => {

      document.body.style.overflow = previousOverflow;

      window.removeEventListener('keydown', handleKeyDown);

      window.removeEventListener('keyup', handleKeyUp);

    };

  }, [open, close, tapButton, status, isPaused, config, skinsOpen, saveDrawerMode]);



  const emulatorReady = status === 'running' || status === 'paused';

  const controlsReady = status === 'running' || status === 'paused';

  const screenLayout = layout?.screen;



  return (

    <>

      {open

        ? createPortal(

            <div
              className={`art-lightbox tamagotchi-lightbox${skinsOpen ? ' tamagotchi-lightbox--skins-open' : ''}${saveDrawerMode ? ' tamagotchi-lightbox--saves-open' : ''}`}
              onClick={close}

              role="dialog"

              aria-modal="true"

              aria-label="Tamagotchi P1"

            >

              {!skinsOpen && !saveDrawerMode ? <LightboxCloseButton onClose={close} label="Close Tamagotchi" /> : null}



              <figure
                className="tamagotchi-panel"
                onClick={(event) => {
                  event.stopPropagation();
                  primeTamagotchiAudio();
                }}
              >
                <div className="tamagotchi-panel__stage">
                  <div className="tamagotchi-shell-wrap tamagotchi-shell-wrap--brick">
                    <div className="tamagotchi-shell-stage">
                      <img className="tamagotchi-brick-face" src={faceUrl} alt={`Tamagotchi shell — ${skin.name}`} />

                      <div className="tamagotchi-shell-overlay" aria-hidden={status === 'error'}>

                      {status === 'error' ? (

                        <p className="tamagotchi-shell-message">{error}</p>

                      ) : (

                        <>

                          {screenLayout ? (

                            <div

                              className="tamagotchi-shell-screen"

                              style={{

                                left: `${screenLayout.left}%`,

                                top: `${screenLayout.top}%`,

                                width: `${screenLayout.width}%`,

                                height: `${screenLayout.height}%`,

                              }}

                            >

                              <TamagotchiScreen ref={screenRef} />

                            </div>

                          ) : null}

                          <TamagotchiShellControls

                            layout={layout}

                            disabled={!emulatorReady || isPaused}

                            onPress={pressButton}

                            onRelease={releaseButton}

                          />

                          {status === 'loading' ? (

                            <p className="tamagotchi-shell-status">Starting…</p>

                          ) : null}

                          {isPaused ? (

                            <p className="tamagotchi-shell-status tamagotchi-shell-status--paused">Paused</p>

                          ) : null}

                        </>

                      )}

                    </div>
                  </div>
                </div>

                  <TamagotchiPanelControls
                    disabled={status === 'loading'}
                    pauseDisabled={!controlsReady}
                    isPaused={isPaused}
                    skinsOpen={skinsOpen}
                    saveDrawerMode={saveDrawerMode}
                    hasAnySaveSlot={hasAnySaveSlot}
                    onTogglePause={togglePause}
                    onNewGame={resetGame}
                    onOpenSave={handleOpenSave}
                    onOpenLoad={handleOpenLoad}
                    onToggleSkins={() => {
                      setSaveDrawerMode(null);
                      setSkinsOpen((current) => !current);
                    }}
                  />
                </div>

                <TamagotchiHints />

                <TamagotchiSkinDrawer

                  open={skinsOpen}

                  skins={skins}

                  activeSkinId={skinId}

                  onSelect={(nextSkinId) => {

                    setSkinId(nextSkinId);

                    setSkinsOpen(false);

                  }}

                  onClose={() => setSkinsOpen(false)}

                />

                <TamagotchiSaveDrawer
                  open={saveDrawerMode != null}
                  mode={saveDrawerMode}
                  slotsInfo={slotsInfo}
                  onSave={handleSaveToSlot}
                  onLoad={handleLoadFromSlot}
                  onClose={() => setSaveDrawerMode(null)}
                />

              </figure>

            </div>,

            document.body,

          )

        : null}



      <div className="tamagotchi-widget">

        <button

          type="button"

          className={`tamagotchi-launcher${open ? ' tamagotchi-launcher--active' : ''}`}

          aria-label="Open Tamagotchi"

          aria-expanded={open}

          onClick={openWidget}

        >

          <span className="tamagotchi-launcher-orbit" aria-hidden="true" />

          <span className="tamagotchi-launcher-body tamagotchi-launcher-body--brick">

            <img className="tamagotchi-launcher-face" src={faceUrl} alt="" />

          </span>

        </button>

      </div>

    </>

  );

}
