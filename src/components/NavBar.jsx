import { AVATAR_URL } from '../data/constants';

const APPS_ICON_PATH =
  'M6,8c1.1,0 2,-0.9 2,-2s-0.9,-2 -2,-2 -2,0.9 -2,2 0.9,2 2,2zM12,20c1.1,0 2,-0.9 2,-2s-0.9,-2 -2,-2 -2,0.9 -2,2 0.9,2 2,2zM6,20c1.1,0 2,-0.9 2,-2s-0.9,-2 -2,-2 -2,0.9 -2,2 0.9,2 2,2zM6,14c1.1,0 2,-0.9 2,-2s-0.9,-2 -2,-2 -2,0.9 -2,2 0.9,2 2,2zM12,14c1.1,0 2,-0.9 2,-2s-0.9,-2 -2,-2 -2,0.9 -2,2 0.9,2 2,2zM16,6c0,1.1 0.9,2 2,2s2,-0.9 2,-2 -0.9,-2 -2,-2 -2,0.9 -2,2zM12,8c1.1,0 2,-0.9 2,-2s-0.9,-2 -2,-2 -2,0.9 -2,2 0.9,2 2,2zM18,14c1.1,0 2,-0.9 2,-2s-0.9,-2 -2,-2 -2,0.9 -2,2 0.9,2 2,2zM18,20c1.1,0 2,-0.9 2,-2s-0.9,-2 -2,-2 -2,0.9 -2,2 0.9,2 2,2z';

export default function NavBar({
  expandOpen,
  onToggleExpand,
  tooltipText,
  tooltipRight,
  onExpandButtonEnter,
  onExpandButtonLeave,
  onAvatarEnter,
  onAvatarLeave,
}) {
  return (
    <div className="nav-bar">
      <div className="nav-items">
        <a href="https://gmail.com">Gmail</a>
      </div>
      <div className="nav-items">
        <a href="https://www.google.com/imghp">Images</a>
      </div>
      <div className="nav-items">
        <div
          className="expand-button"
          role="button"
          tabIndex={0}
          aria-expanded={expandOpen}
          onClick={onToggleExpand}
          onMouseEnter={onExpandButtonEnter}
          onMouseLeave={onExpandButtonLeave}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onToggleExpand();
            }
          }}
        >
          <svg className="gb_i" focusable="false" viewBox="0 0 24 24">
            <path fill="#FFF" d={APPS_ICON_PATH} />
          </svg>
        </div>
      </div>
      <div className="nav-items">
        <div
          className="avatar"
          onMouseEnter={onAvatarEnter}
          onMouseLeave={onAvatarLeave}
        >
          <img src={AVATAR_URL} alt="Profile" />
        </div>
      </div>

      <div
        className="expand-tooltip"
        style={{
          display: tooltipText ? 'block' : 'none',
          right: `${tooltipRight}px`,
        }}
      >
        {tooltipText}
      </div>
    </div>
  );
}
