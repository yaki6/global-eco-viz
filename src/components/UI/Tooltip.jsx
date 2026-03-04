export default function Tooltip({ x, y, visible, children }) {
  if (!visible) return null;
  return (
    <div
      className="absolute pointer-events-none bg-white border border-gray-200 rounded shadow-lg px-3 py-2 text-sm z-50"
      style={{ left: x + 10, top: y - 10 }}
    >
      {children}
    </div>
  );
}
