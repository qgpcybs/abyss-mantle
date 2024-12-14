export type ItemContainerProps = {
  disabled?: boolean;
  selected?: boolean;
} & JSX.IntrinsicElements["div"];

export default function ItemContainer({
  className,
  disabled,
  selected,
  onClick,
  children,
  ...passProps
}: ItemContainerProps) {
  return (
    <div
      className={[
        "flex flex-col w-auto p-1 border cursor-pointer hover:text-info hover:border-info",
        disabled && selected
          ? "opacity-80 bg-gray-500 text-white"
          : disabled
            ? "opacity-80 bg-gray-500 text-gray-900 "
            : selected
              ? "bg-gray-200 text-black border-blue-700 border-2 rounded"
              : "",
        className ?? "",
      ].join(" ")}
      onClick={disabled ? undefined : onClick}
      {...passProps}
    >
      {children}
    </div>
  );
}
