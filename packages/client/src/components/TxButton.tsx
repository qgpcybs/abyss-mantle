import { useState } from "react";
import loadingGif from "../assets/icons/loading.gif";

type TxButtonProps = {
  text?: string;
  disabledText?: string;
  className?: string;
  beforeTx?: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tx?: () => Promise<any>;
  afterTx?: () => void;
  disabled?: boolean;
  style?: React.CSSProperties;
} & Omit<JSX.IntrinsicElements["button"], "onClick">;

export default function TxButton({
  text,
  disabledText,
  className,
  beforeTx,
  tx,
  afterTx,
  disabled,
  style,
  children,
  ...props
}: TxButtonProps) {
  const [loading, setLoading] = useState(false);
  return (
    <button
      className={`btn-tx ${className}`}
      onClick={async (event: React.MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        setLoading(true);
        beforeTx?.();
        await tx?.().catch((e) => setLoading(false));
        setLoading(false);
        afterTx?.();
      }}
      disabled={disabled || loading}
      style={style}
      {...props}>
      <span className="flex flex-row items-center justify-center">
        {loading && (
          <img src={loadingGif} className="h-[1.2rem] aspect-square" />
        )}
        {text}
        {children}
      </span>
    </button>
  );
}
