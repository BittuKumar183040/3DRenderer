import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

const TextArea = ({
  label,
  spellCheck = false,
  value,
  onChange,
  defaultCollapsed = false,
}) => {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <div
      className={`flex flex-col transition-all duration-300 overflow-hidden ${
        collapsed ? "flex-none" : "flex-1"
      }`}
    >
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-2 px-5 py-2 font-semibold text-neutral-300 border-b border-neutral-800 hover:bg-neutral-900"
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
        {label}
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ${
          collapsed ? "max-h-0 opacity-0" : "max-h-[2000px] flex-1 opacity-100"
        }`}
      >
        <textarea
          spellCheck={spellCheck}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-full resize-none bg-neutral-900 p-4 font-mono text-xs outline-none"
        />
      </div>
    </div>
  );
};

export default TextArea;