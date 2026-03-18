export function MathBackground() {
  const symbols = ['+', '−', '×', '?', '='];
  const positions = [
    { symbol: '+', top: '8%', left: '12%', rotation: 15, size: '24px', opacity: 0.25 },
    { symbol: '−', top: '15%', left: '75%', rotation: -20, size: '22px', opacity: 0.22 },
    { symbol: '×', top: '22%', left: '35%', rotation: 25, size: '26px', opacity: 0.2 },
    { symbol: '?', top: '28%', left: '85%', rotation: -15, size: '28px', opacity: 0.23 },
    { symbol: '=', top: '35%', left: '18%', rotation: 10, size: '24px', opacity: 0.21 },
    { symbol: '+', top: '42%', left: '68%', rotation: -25, size: '23px', opacity: 0.24 },
    { symbol: '×', top: '48%', left: '28%', rotation: 20, size: '25px', opacity: 0.22 },
    { symbol: '−', top: '55%', left: '78%', rotation: 15, size: '22px', opacity: 0.2 },
    { symbol: '?', top: '62%', left: '15%', rotation: -18, size: '27px', opacity: 0.23 },
    { symbol: '=', top: '68%', left: '55%', rotation: 22, size: '24px', opacity: 0.21 },
    { symbol: '+', top: '75%', left: '38%', rotation: -12, size: '23px', opacity: 0.25 },
    { symbol: '×', top: '82%', left: '72%', rotation: 18, size: '26px', opacity: 0.22 },
    { symbol: '−', top: '88%', left: '25%', rotation: -22, size: '22px', opacity: 0.2 },
    { symbol: '?', top: '12%', left: '48%', rotation: 12, size: '28px', opacity: 0.24 },
    { symbol: '=', top: '45%', left: '8%', rotation: -16, size: '24px', opacity: 0.21 },
    { symbol: '+', top: '72%', left: '88%', rotation: 20, size: '23px', opacity: 0.23 },
    { symbol: '×', top: '18%', left: '58%', rotation: -14, size: '25px', opacity: 0.22 },
    { symbol: '−', top: '52%', left: '45%', rotation: 16, size: '22px', opacity: 0.2 },
    { symbol: '?', top: '78%', left: '62%', rotation: -20, size: '27px', opacity: 0.24 },
    { symbol: '=', top: '32%', left: '92%', rotation: 14, size: '24px', opacity: 0.21 },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {positions.map((item, index) => (
        <div
          key={index}
          className="absolute font-bold text-purple-300"
          style={{
            top: item.top,
            left: item.left,
            transform: `rotate(${item.rotation}deg)`,
            fontSize: item.size,
            opacity: item.opacity * 2.5,
          }}
        >
          {item.symbol}
        </div>
      ))}
    </div>
  );
}