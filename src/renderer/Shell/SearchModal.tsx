import { messages } from "common/butlerd";
import { Game } from "common/butlerd/messages";
import { gameCover } from "common/game-cover";
import { packets } from "common/packets";
import React, { useCallback, useEffect, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { Button } from "renderer/basics/Button";
import { Ellipsis } from "renderer/basics/Ellipsis";
import { IconButton } from "renderer/basics/IconButton";
import { Modal } from "renderer/basics/Modal";
import { useDebounce } from "renderer/basics/useDebounce";
import { useProfile, useSocket } from "renderer/contexts";
import { fontSizes } from "renderer/theme";
import { useAsyncCb } from "renderer/use-async-cb";
import styled from "styled-components";

const SearchTopBar = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-bottom: 10px;

  padding: 10px;
  padding-right: 0;
`;

const SearchExit = styled(IconButton)`
  flex-shrink: 0;
`;

const SearchInputContainer = styled.div`
  flex-grow: 1;

  border: 2px solid ${p => p.theme.colors.inputBorder};
  &:focus {
    border-color: ${p => p.theme.colors.inputBorderFocus};
  }
  background: ${p => p.theme.colors.inputBg};
  color: ${p => p.theme.colors.text1};
  padding: 10px 5px;

  position: relative;

  .ellipsis {
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateX(-200%) translateY(-50%) scale(0.4);
  }
`;

const SearchInput = styled.input`
  width: 100%;

  color: inherit;
  border: none;
  outline: none;
  background: none;
  font-size: ${fontSizes.enormous};
`;

const SearchResults = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;

  width: 100%;
  height: 40vh;
  overflow-y: scroll;
`;

let coverWidth = 290;
let coverHeight = 230;
let ratio = 0.28;

const SearchResult = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;

  img.cover {
    width: ${coverWidth * ratio}px;
    height: ${coverHeight * ratio}px;
    margin-right: 10px;
  }

  margin-bottom: 10px;
  &:last-child {
    margin-bottom: 0;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .text-section {
    display: flex;
    flex-direction: column;
    line-height: 1.4;

    .title {
      font-weight: 900;
      font-size: ${fontSizes.large};
    }

    .short-text {
      font-weight: normal;
      font-size: ${fontSizes.normal};
      color: ${p => p.theme.colors.text2};
    }
  }
`;

const SearchBottomBar = styled.div`
  flex-shrink: 0;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;

  height: 60px;
`;

const SearchModalContainer = styled(Modal)`
  width: 60vw;
  max-width: 960px;

  .modal-body {
    padding: 0;
    overflow: hidden;
  }
`;

export const SearchModal = (props: { onClose: () => void }) => {
  const socket = useSocket();
  const profile = useProfile();
  const { onClose } = props;

  const [results, setResults] = useState<Game[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    (async () => {
      if (debouncedSearchTerm.length < 2) {
        setResults([]);
        return;
      }

      const { games } = await socket.call(messages.SearchGames, {
        profileId: profile!.id,
        query: debouncedSearchTerm,
      });
      setResults(games);
    })().catch(e => console.warn(e.stack));
  }, [debouncedSearchTerm]);

  const [onChange] = useAsyncCb(
    async (ev: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(ev.currentTarget.value);
    },
    [socket, profile]
  );

  const onKeyDown = useCallback(
    (ev: React.KeyboardEvent<HTMLInputElement>) => {
      if (ev.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  const onViewAll = useCallback(() => {
    onClose();
    let url = new URL("https://itch.io/search");
    url.searchParams.set("q", debouncedSearchTerm);
    socket.send(packets.navigate, { url: url.toString() });
  }, [debouncedSearchTerm, onClose]);

  const intl = useIntl();

  return (
    <SearchModalContainer closeOnClickOutside>
      <SearchTopBar>
        <SearchInputContainer>
          <SearchInput
            placeholder={intl.formatMessage({ id: "search.placeholder" })}
            type="search"
            onChange={onChange}
            onKeyDown={onKeyDown}
            autoFocus
          />
          <Ellipsis />
        </SearchInputContainer>
        <SearchExit icon="cross" wide onClick={onClose} />
      </SearchTopBar>
      <SearchResults>
        {results.map(game => {
          return (
            <SearchResult key={`${game.id}`}>
              <img className="cover" src={gameCover(game)} />
              <div className="text-section">
                <div className="title">{game.title}</div>
                <div className="short-text">{game.shortText}</div>
              </div>
            </SearchResult>
          );
        })}
      </SearchResults>
      <SearchBottomBar>
        <Button
          secondary
          label={<FormattedMessage id="game_stripe.view_all" />}
          onClick={onViewAll}
        />
      </SearchBottomBar>
    </SearchModalContainer>
  );
};