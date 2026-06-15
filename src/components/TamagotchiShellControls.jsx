function ShellButton({ label, layout, onPress, onRelease, disabled }) {
  if (!layout) {
    return null;
  }

  return (
    <button
      type="button"
      className="tamagotchi-shell-button"
      style={{
        left: `${layout.left}%`,
        top: `${layout.top}%`,
        width: `${layout.width}%`,
        height: `${layout.height}%`,
      }}
      aria-label={`Tamagotchi button ${label}`}
      disabled={disabled}
      onMouseDown={(event) => {
        event.preventDefault();
        onPress(label);
      }}
      onMouseUp={() => onRelease(label)}
      onMouseLeave={() => onRelease(label)}
      onTouchStart={(event) => {
        event.preventDefault();
        onPress(label);
      }}
      onTouchEnd={() => onRelease(label)}
      onTouchCancel={() => onRelease(label)}
    />
  );
}

export default function TamagotchiShellControls({ layout, onPress, onRelease, disabled }) {
  if (!layout?.buttons) {
    return null;
  }

  return (
    <>
      <ShellButton
        label="A"
        layout={layout.buttons.A}
        disabled={disabled}
        onPress={onPress}
        onRelease={onRelease}
      />
      <ShellButton
        label="B"
        layout={layout.buttons.B}
        disabled={disabled}
        onPress={onPress}
        onRelease={onRelease}
      />
      <ShellButton
        label="C"
        layout={layout.buttons.C}
        disabled={disabled}
        onPress={onPress}
        onRelease={onRelease}
      />
    </>
  );
}
