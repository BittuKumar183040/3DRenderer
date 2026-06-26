
const TextArea = ({label, spellCheck = false, value, onChange}) => {
  return (
    <>
      <div className="px-5 py-2 font-semibold text-neutral-300">
        {label}
      </div>

      <textarea
        spellCheck={spellCheck}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 resize-none bg-neutral-900 p-4 pt-1 font-mono text-xs outline-none"
      />
    </>
  );
};

export default TextArea;
