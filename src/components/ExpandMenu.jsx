import { EXPAND_MENU_ITEMS } from '../data/constants';

export default function ExpandMenu({ open, onItemHover, onItemLeave, dropdownTooltip }) {
  if (!open) return null;

  return (
    <>
      <div className="expand-wrapper">
        <div className="expand-menu">
          <ul className="expand-list">
            {EXPAND_MENU_ITEMS.map((item, index) => (
              <li
                key={item.name}
                className="expand-item"
                onMouseEnter={(e) => onItemHover(index, item.name, e)}
                onMouseLeave={onItemLeave}
              >
                <a href={item.href}>
                  <img src={item.img} alt={item.name} style={item.style} />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div
        className="dropdown-tooltip"
        style={{
          display: dropdownTooltip.visible ? 'block' : 'none',
          left: dropdownTooltip.left,
          top: dropdownTooltip.top,
        }}
      >
        {dropdownTooltip.text}
      </div>
    </>
  );
}
