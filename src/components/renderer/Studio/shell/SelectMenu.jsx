import { useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { FaAngleDown } from "react-icons/fa";

const SelectMenu = ({ title, items = [], handleClick }) => {
  const [toggle, setToggle] = useState(false)
  const popupRef = useRef(null)

  const handleClickOutside = (event) => {
    if (popupRef.current && !popupRef.current.contains(event.target)) {
      setToggle(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div ref={popupRef} className='select-menu'>
      <button
        type='button'
        className={`select-trigger ${toggle ? 'is-open' : ''}`}
        onClick={() => setToggle(!toggle)}
        aria-expanded={toggle}
        aria-haspopup='menu'
      >
        <span>{title}</span>
        <FaAngleDown className='select-caret' />
      </button>

      <div className={`select-popover ${toggle ? 'is-open' : ''}`} role='menu'>
        {items.length === 0 && <p className='select-empty'>No objects</p>}
        {items.map((item, index) => <button
          type='button'
          role='menuitem'
          key={item.uuid || index}
          title={item.name}
          onClick={() => handleClick(item)}
          className='select-option'
        >
          {item.name || item.type || `Object ${index + 1}`}
        </button>)}
      </div>
    </div>
  )
}

SelectMenu.propTypes = {
  title: PropTypes.string,
  items: PropTypes.array,
  handleClick: PropTypes.func.isRequired,
}

export default SelectMenu
