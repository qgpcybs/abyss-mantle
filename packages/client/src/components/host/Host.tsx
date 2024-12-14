import { Entity, getComponentValue, setComponent } from "@latticexyz/recs";
import { useMUD } from "../../MUDContext";
import { isBuilding } from "../../logics/entity";
import { Building } from "../building/Building";
import { Role } from "./Role";
import { useState } from "react";
import { useComponentValue } from "@latticexyz/react";
import { SOURCE } from "../../constants";
import { Transfer } from "../building/Transfer";
import { getHostsAdjacentCoord } from "../../logics/building";

/**
 * display a host, either a building or a role
 */
export function Host({ host }: { host: Entity }) {
  const { components } = useMUD();
  const { SelectedHost, HostName, BotState } = components;
  const sourceHost = useComponentValue(SelectedHost, SOURCE)?.value as Entity;
  const buildingType = isBuilding(components, host);
  // switch between transfer from sourceHost or to sourceHost
  const [toTransfer, setToTransfer] = useState(true);

  const adjacentInfo = getHostsAdjacentCoord(components, host, sourceHost);

  const agentName = getComponentValue(HostName, host)?.name as string;
  const hostName = getComponentValue(HostName, sourceHost)?.name as string;
  const [chatText, setChatText] = useState<string>("");
  const [resName, setResName] = useState<string>("");
  const [resText, setResText] = useState<string>("");
  const chooseStrategy = (strategy: string) => {
    setComponent(BotState, host, {
      strategies: [strategy],
      target: sourceHost,
      targetX: undefined,
      targetY: undefined,
      violence: false,
    });
  };
  const chat = async (text: string) => {
    const agentId = "f43a79df-d424-05a8-a56f-99967c2caaf6";
    const response = await fetch(`http://localhost:3000/${agentId}/message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body:
        `text=${encodeURIComponent(text)}` +
        `&name=${hostName}` +
        `&userName=${hostName}` +
        `&agentName=${agentName}`,
    })
      .then(async (response) => {
        const reader = response.body?.getReader();
        if (!reader) return;
        reader.read().then(({ done, value }) => {
          if (done) return;
          const enc = new TextDecoder("utf-8");
          const textJson = enc.decode(value, { stream: true });
          const text = JSON.parse(textJson)[0];
          setResName(text.user);
          setResText(text.text);
          const content = text.text.toLocaleLowerCase();
          if (content.includes("yes")) {
            chooseStrategy("exploration");
          } else if (content.includes("ok")) {
            chooseStrategy("plunder");
          } else {
            console.log("Sorry!");
          }
        });
      })
      .catch((e) => console.log(e));
  };

  return (
    <div className="flex flex-row">
      {buildingType ? <Building building={host} /> : <Role role={host} />}
      {sourceHost && host !== sourceHost && (
        <div>
          <div>
            {adjacentInfo && (
              <button
                className="bg-gray-300 hover:bg-green-400 text-green-800 font-bold py-2 px-4 rounded-l"
                onClick={() => setToTransfer(!toTransfer)}>
                {toTransfer ? "Switch Transfer" : "Switch Transfer"}
              </button>
            )}
            {toTransfer && <Transfer fromHost={sourceHost} toHost={host} />}
            {!toTransfer && <Transfer fromHost={host} toHost={sourceHost} />}
          </div>
          {agentName && (
            <div>
              <div className=" flex flex-col w-[36vw] m-1 p-1">
                <span>Chat</span>
                <textarea
                  className="h-16 text-sm"
                  value={chatText}
                  onChange={(e) => setChatText(e.target.value)}
                  placeholder="Say hello~"
                />
                <button
                  className="btn-blue mt-2 py-1 break-words"
                  onClick={() => chat(chatText)}>
                  Chat with {agentName}
                </button>
              </div>
              <div className="max-w-[36vw] mt-4 px-1">
                <span>
                  {resName}
                  {resName ? ":" : undefined}
                </span>
                <br />
                <p className="mt-2 text-sm">{resText}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
