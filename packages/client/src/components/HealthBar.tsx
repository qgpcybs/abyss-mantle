export type HealthBarProps = {
  value: number;
  maxValue: number;
  text?: string;
  unitValue?: number;
  fillColor?: string;
  borderColor?: string;
};

export default function HealthBar({
  value,
  maxValue,
  text,
  unitValue = 20,
  fillColor,
  borderColor,
}: HealthBarProps) {
  const gapPercent = (unitValue / maxValue) * 100;
  const valuePercent = (value / maxValue) * 100;
  return (
    <div className="flex flex-col items-end">
      <div className="flex flex-col w-full items-end text-red-500">
        {text && (
          <div
            className="flex flex-row w-full justify-between text-sm"
            style={{ color: fillColor }}
          >
            <span>{text}: </span>
            <span className="text-xs">
              {value}/{maxValue}
            </span>
          </div>
        )}
        <div
          className={`w-full border border-${fillColor}-500`}
          style={{ width: "fit-content" }}
        >
          <div className="h-4 border border-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
              <rect
                height="100%"
                width={`${valuePercent}%`}
                fill={fillColor ?? "currentColor"}
              />
              <line
                x1="0"
                x2="100%"
                stroke={borderColor ?? "gray"}
                strokeWidth="100%"
                strokeDashoffset="1"
                strokeDasharray={`1 ${gapPercent}%`}
                strokeLinecap="butt"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
