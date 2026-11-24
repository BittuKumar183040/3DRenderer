export const ButtonSecondary = ({ label, onClick }) => {
  return (
    <button type="button" onClick={onClick} className="editor-button editor-button-secondary">
      {label}
    </button>
  )
}

export const ButtonPrimary = ({ label, onClick }) => {
  return (
    <button type="button" onClick={onClick} className="editor-button editor-button-primary">
      {label}
    </button>
  )
}
