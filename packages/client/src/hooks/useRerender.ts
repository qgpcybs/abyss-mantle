import { useEffect, useState } from "react";

export default function useRerender(interval?: number) {
  interval = interval || 1000;
  const rerender = useState({})[1];

  useEffect(() => {
    const id = setInterval(() => {
      rerender({});
    }, interval);
    return () => clearInterval(id);
  }, [interval]);

  return rerender;
}
