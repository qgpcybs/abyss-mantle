import { Entity } from "@latticexyz/recs";
import { useEffect, useState } from "react";
import { useMUD } from "../MUDContext";
import { truncateBytes32 } from "../utils/format";

export default function TxSuccessMessage({
  hash,
  message,
}: {
  hash: Entity;
  message: string;
}) {
  return (
    <div className="flex flex-col items-end justify-center bg-black border border-white text-white ">
      <div className="flex flex-col m-2 p-2">
        <span className="text-s ">Tx Success: {message}</span>
        <span className="text-s ">
          <HashUrl hash={hash as string} />
        </span>
      </div>
      <ShrinkingBar color="green" />
    </div>
  );
}

export function TxPendingMessage({
  hash,
  message,
}: {
  hash: Entity;
  message: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center bg-black border border-white text-white">
      <div className="flex flex-col m-2 p-2">
        <span className="text-s ">Tx Pending: {message}</span>
        <span className="text-s ">
          <HashUrl hash={hash as string} />
        </span>
      </div>
      <ShrinkingBar color="yellow" />
    </div>
  );
}

export function TxErrorMessage({
  hash,
  message,
}: {
  hash: Entity;
  message: string;
}) {
  const errorMessage = message.split("Contract Call")[0];
  const [isExpanded, setIsExpanded] = useState(false);
  const toggleExpand = () => setIsExpanded(!isExpanded);
  return (
    <div
      className="flex flex-col items-center justify-center text-white bg-black border border-white m-1 p-1"
      style={{ maxWidth: "300px" }}
    >
      <div className="flex flex-col items-center justify-between w-full">
        <span>Tx Error:</span>
        <span className="text-s cursor-pointer" onClick={toggleExpand}>
          {isExpanded ? message : errorMessage}
        </span>
        <button onClick={toggleExpand} className="btn-pink self-end">
          {isExpanded ? "Collapse" : "Expand"}
        </button>
      </div>
      <ShrinkingBar color="red" />
    </div>
  );
}

export function ShrinkingBar({ color }: { color: string }) {
  return (
    <div className={`w-full  mt-2 relative`} style={{ backgroundColor: color }}>
      <div
        className={`absolute right-0 h-2`}
        style={{
          animation: "shrink 5s linear forwards",
          width: "100%",
          backgroundColor: color,
        }}
      ></div>
      <style>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
}

export function HashUrl({ hash }: { hash: string }) {
  const {
    network: { blockExplorerUrl },
  } = useMUD();
  const link = `${blockExplorerUrl}/tx/${hash}`;

  return (
    <a
      href={link}
      target="_blank"
      rel="noreferrer"
      className="text-blue-500 underline cursor-pointer"
    >
      {truncateBytes32(hash, 14, 14)}
    </a>
  );
}
