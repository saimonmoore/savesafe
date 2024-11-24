import { generatePath, useNavigate } from "react-router-dom";

import { ClientProvider } from "@dxos/react-client";

import { Main } from "../Main/Main";
import { getConfig } from "../../../config";
import { AccountType, CategoryType, TransactionType } from "../../../types";

// const createWorker = () =>
//   new SharedWorker(new URL("../../../shared-worker", import.meta.url), {
//     type: "module",
//     name: "dxos-client-worker",
//   });

const createWorker = () => {

  const url = new URL("../../../shared-worker", import.meta.url);
  console.log('[Root#createWorker] ==========> ', { url });
  return new SharedWorker(url, {
    type: "module",
    name: "dxos-client-worker",
  });
}

export const Root = () => {
  const navigate = useNavigate();
  console.log("[Root] ===============> render() ");

  return (
    <ClientProvider
      config={getConfig}
      createWorker={createWorker}
      shell="./shell.html"
      types={[AccountType, CategoryType, TransactionType]}
      onInitialized={async (client) => {
        const searchParams = new URLSearchParams(location.search);
        const deviceInvitationCode = searchParams.get("deviceInvitationCode");
        if (!client.halo.identity.get() && !deviceInvitationCode) {
          console.log(
            "[Root#onInitialized] ============> No identity and no deviceInvitationCode ",
            { deviceInvitationCode }
          );
          await client.halo.createIdentity();
          await client.spaces.waitUntilReady();
          await client.spaces.default.waitUntilReady();
          console.log(
            "[Root#onInitialized] ============> Identity and space created: ",
            {
              identity: client.halo.identity.get(),
              space: client.spaces.default,
            }
          );
          // TODO: Transactions should belong to an account
          // createTodoList(client.spaces.default);
        }

        const spaceInvitationCode = searchParams.get("spaceInvitationCode");

        console.log(
          "[Root#onInitialized] ============> Checking invitation code: ",
          { spaceInvitationCode }
        );

        if (spaceInvitationCode) {
          void client.shell
            .joinSpace({ invitationCode: spaceInvitationCode })
            .then(({ space }) => {
              // eslint-disable-next-line @typescript-eslint/no-unused-expressions
              space &&
                navigate(
                  generatePath("/:spaceKey", { spaceKey: space.key.toHex() })
                );
            });
        } else if (deviceInvitationCode) {
          console.log(
            "[Root#onInitialized] ============> Found device invitation code: ",
            { deviceInvitationCode }
          );

          void client.shell.joinIdentity({
            invitationCode: deviceInvitationCode,
          });
        }
      }}
    >
      <h1>ROOT child</h1>
      <Main />
    </ClientProvider>
  );
};
