
export const ButtonSecondary = ({label, onClick}) => {
  return (
    <button onClick={onClick} className="rounded-md bg-neutral-700 px-4 py-2 text-sm font-medium transition hover:bg-neutral-600" >
      {label}
    </button>
  )
}

export const ButtonPrimary = ({label, onClick}) => {
  return (  
    <button onClick={onClick} className="rounded-md bg-blue-600 px-4 py-2 text-xs font-medium transition hover:bg-blue-500">
      {label}
    </button>
  )
}
