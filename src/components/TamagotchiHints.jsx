export default function TamagotchiHints() {
  return (
    <div className="tamagotchi-hints tamagotchi-hints--below">
      <p className="tamagotchi-hints__title">How to play</p>
      <div className="tamagotchi-hints__grid">
        <div className="tamagotchi-hints__item">
          <span className="tamagotchi-hints__keys">
            <kbd>1</kbd>
            <kbd>2</kbd>
            <kbd>3</kbd>
          </span>
          <span className="tamagotchi-hints__or">or</span>
          <span className="tamagotchi-hints__keys">
            <kbd>←</kbd>
            <kbd>↓</kbd>
            <kbd>→</kbd>
          </span>
        </div>
        <div className="tamagotchi-hints__item tamagotchi-hints__item--actions">
          <span>
            <strong>A</strong> cycle
          </span>
          <span className="tamagotchi-hints__dot" aria-hidden="true">
            ·
          </span>
          <span>
            <strong>B</strong> select
          </span>
          <span className="tamagotchi-hints__dot" aria-hidden="true">
            ·
          </span>
          <span>
            <strong>C</strong> cancel
          </span>
        </div>
      </div>
    </div>
  );
}
