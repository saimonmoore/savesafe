import { useEffect } from "react";
import { generatePath, Navigate, Outlet, useParams } from "react-router-dom";

import { useClient } from "@dxos/react-client";
import { useSpace, useSpaces } from "@dxos/react-client/echo";

import { SpaceList } from "@/components/view/SpaceList/SpaceList";

export const Main = () => {
  const { spaceId } = useParams();
  const client = useClient();
  const spaces = useSpaces();
  const space = useSpace(spaceId);

  useEffect(() => {
    const handleKeyDown = async (event: KeyboardEvent) => {
      const modifier = event.ctrlKey || event.metaKey;
      if (event.key === "." && event.shiftKey && modifier) {
        await client.shell.open();
      } else if (space && event.key === "." && modifier) {
        await client.shell.shareSpace({ spaceId: space.id });
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [client, space]);

  if (!spaceId && spaces.length > 0) {
    return (
      <Navigate to={generatePath("/:spaceId", { spaceId: spaces[0].id })} />
    );
  }

  return (
    <>
      <SpaceList current={space} />
      <Outlet context={{ space }} />
    </>
  );
};
