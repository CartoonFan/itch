import { messages } from "common/butlerd";
import { queries } from "common/queries";
import React, { useState } from "react";
import { useAsyncCallback } from "react-async-hook";
import { FormattedMessage } from "react-intl";
import { InstallModal } from "renderer/App/InstallModal";
import { Button } from "renderer/basics/Button";
import { useSocket } from "renderer/contexts";
import styled from "renderer/styles";
import { Call, useButlerd } from "renderer/use-butlerd";

const Container = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-right: 15px;
`;

const Cover = styled.img`
  height: 100px;
`;

const Info = styled.div`
  margin-left: 10px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;

  * {
    padding: 4px 0;
  }
`;

const Filler = styled.div`
  flex-grow: 1;
`;

interface Props {
  path: string;
}

const WebviewGameActionBar = (props: { gameId: number }) => {
  const socket = useSocket();
  let [installing, setInstalling] = useState(false);

  const { gameId } = props;

  let launchGame = useAsyncCallback(async (gameId: number) => {
    await socket.query(queries.launchGame, { gameId });
  });

  const cavesReq = useButlerd(messages.FetchCaves, { filters: { gameId } });
  let caves = cavesReq.state === "success" && (cavesReq.result.items || []);

  return (
    <Container>
      <Call
        rc={messages.FetchGame}
        params={{ gameId }}
        render={({ game }) => (
          <>
            <Cover src={game.stillCoverUrl || game.coverUrl} />
            <Info>
              <span>{game.title}</span>
              {caves && <span>Found {caves.length} caves</span>}
            </Info>
            <Filler />
            {caves &&
              (caves.length > 0 ? (
                <Button
                  label={<FormattedMessage id="grid.item.launch" />}
                  wide
                  disabled={launchGame.loading}
                  onClick={() => launchGame.execute(gameId)}
                />
              ) : (
                <Button
                  label={<FormattedMessage id="grid.item.install" />}
                  wide
                  onClick={() => setInstalling(true)}
                />
              ))}
            {installing ? (
              <InstallModal game={game} onClose={() => setInstalling(false)} />
            ) : null}
          </>
        )}
      />
    </Container>
  );
};

export const WebviewActionBar = (props: Props) => {
  const { path } = props;
  if (!path) {
    return <></>;
  }

  const matches = /^games\/([0-9]+)$/.exec(path);
  if (matches) {
    const gameId = parseInt(matches[1], 10);
    return <WebviewGameActionBar gameId={gameId} />;
  }

  return <></>;
};

export default WebviewActionBar;
