import * as React from "react";
import * as classNames from "classnames";
import { connect } from "../connect";
import Chart from "./chart";

import { truncate, downloadProgress, fileSize } from "../../format";

import * as actions from "../../actions";

import TimeAgo from "../basics/time-ago";
import IconButton from "../basics/icon-button";
import Hover, { IHoverProps } from "../basics/hover-hoc";
import Cover from "../basics/cover";
import MainAction from "../game-actions/main-action";

import {
  IDownloadSpeeds,
  IDownloadItem,
  ITask,
  IRootState,
  ILocalizedString,
} from "../../types";
import { dispatcher } from "../../constants/action-types";

import styled, * as styles from "../styles";
import { darken } from "polished";

import format, { formatString } from "../format";
import { injectIntl, InjectedIntl } from "react-intl";
import doesEventMeanBackground from "../when-click-navigates";
import getGameStatus, {
  IGameStatus,
  IOperation,
  OperationType,
} from "../../helpers/get-game-status";

const DownloadRowDiv = styled.div`
  font-size: ${props => props.theme.fontSizes.large};

  flex-shrink: 0;
  line-height: 1.6;
  border-radius: 2px;
  padding: 7px 5px 7px 10px;
  margin: 10px 0px 5px 0px;
  cursor: default;
  position: relative;

  max-width: 800px;

  border: 1px solid transparent;

  &.finished {
    cursor: pointer;
  }

  background-color: ${props => darken(0.05, props.theme.explanation)};

  &.first,
  &.finished,
  &:hover {
    background-color: ${props => props.theme.explanation};
  }

  .cover,
  .progress,
  .controls,
  .game-title,
  .timeago {
    z-index: 4;
  }

  .controls {
    &.small {
      align-self: flex-start;
    }
  }

  .game-title {
    font-weight: bold;
  }

  .cover,
  .progress {
    transition: -webkit-filter 1s;
  }

  &.dimmed {
    .cover,
    .progress,
    .timeago {
      -webkit-filter: grayscale(100%) brightness(50%);
    }

    .controls,
    .game-title {
      color: $secondary-text-color;
    }

    .stats {
      color: darken($secondary-text-color, 10%);
    }
  }

  .game-title {
    ${styles.singleLine()} max-width: 500px;
  }

  .timeago {
    font-size: 80%;
    color: $secondary-text-color;
    display: flex;
    flex-direction: row;

    .filler {
      flex-grow: 1;
      min-width: 20px;
    }
  }

  display: flex;
  align-items: center;

  .stats {
    flex-grow: 1;
    height: $download-cover-height;
    display: flex;
    align-items: center;

    .stats-inner {
      width: 100%;
    }

    .progress {
      ${styles.progress()};
      margin: 10px 0;
      height: 5px;
      overflow: hidden;

      &,
      .progress-inner {
        border-radius: 5px;
      }

      .progress-inner.indeterminate {
        animation: ${styles.animations.horizontalIndeterminate} 2.4s ease-in-out
          infinite;
      }
    }
  }

  .stats--control {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .control--title {
    padding-bottom: 0.5em;
    font-weight: bold;
  }

  .control--reason {
    font-weight: normal;
    color: ${props => props.theme.secondaryText};
  }
`;

const StyledCover = styled(Cover)`
  flex-shrink: 0;
  width: 105px;
  height: 80px;
  padding-bottom: 0;

  margin-right: 16px;
`;

const Controls = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding-left: 8px;
`;

class DownloadRow extends React.PureComponent<IProps & IDerivedProps> {
  constructor() {
    super();
    this.state = {};
  }

  onCoverContextMenu = (ev: React.MouseEvent<any>) => {
    const { item, openGameContextMenu } = this.props;
    const { game } = item;
    openGameContextMenu({ game, pageX: ev.pageX, pageY: ev.pageY });
  };

  onNavigate = () => {
    const { item, navigateToGame } = this.props;
    const { game } = item;
    navigateToGame({ game });
  };

  render() {
    const { first, active, item, navigateToGame, speeds } = this.props;

    const { game } = item;
    const { coverUrl, stillCoverUrl } = game;

    let onStatsClick = (): void => null;
    if (!active) {
      onStatsClick = this.onNavigate;
    }

    const itemClasses = classNames({
      first,
      dimmed: active && !first,
      finished: !active,
    });

    const { hover, onMouseEnter, onMouseLeave } = this.props;

    return (
      <DownloadRowDiv
        className={itemClasses}
        onContextMenu={this.onCoverContextMenu}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {first ? <Chart data={speeds} /> : null}

        <StyledCover
          hover={hover}
          coverUrl={coverUrl}
          stillCoverUrl={stillCoverUrl}
          gameId={game.id}
          onClick={ev =>
            navigateToGame({ game, background: doesEventMeanBackground(ev) })}
        />
        <div className="stats" onClick={onStatsClick}>
          {this.progress()}
        </div>
        {this.controls()}
      </DownloadRowDiv>
    );
  }

  controls() {
    const { intl, first, item, retryDownload, status } = this.props;
    const {
      resumeDownloads,
      pauseDownloads,
      prioritizeDownload,
      cancelDownload,
    } = this.props;
    const { id, err } = item;

    if (!status.operation && err) {
      return (
        <div className="controls small">
          <IconButton icon="repeat" onClick={() => retryDownload({ id })} />
        </div>
      );
    }

    if (!status.operation) {
      return (
        <div className="controls small">
          <IconButton
            icon="cross"
            hintPosition="left"
            hint={formatString(intl, ["status.downloads.clear_finished"])}
            onClick={() => cancelDownload({ id })}
          />
        </div>
      );
    }

    return (
      <Controls>
        {first ? status.operation.paused ? (
          <IconButton
            big
            icon="triangle-right"
            onClick={() => resumeDownloads({})}
          />
        ) : (
          <IconButton big icon="pause" onClick={() => pauseDownloads({})} />
        ) : (
          <IconButton
            big
            hint={formatString(intl, ["grid.item.prioritize_download"])}
            icon="caret-up"
            onClick={() => prioritizeDownload({ id })}
          />
        )}
        <IconButton
          big
          hintPosition="left"
          hint={formatString(intl, ["grid.item.cancel_download"])}
          icon="cross"
          onClick={() => cancelDownload({ id })}
        />
      </Controls>
    );
  }

  progress() {
    const { first, active, item, status } = this.props;
    const { err, game, finishedAt, reason } = item;
    const { operation } = status;

    if (!active && !operation) {
      if (err) {
        return (
          <div className="error-message">
            {format(["status.downloads.download_error"])}
            <div className="timeago" data-rh-at="top" data-rh={err}>
              {truncate(err, { length: 60 })}
            </div>
          </div>
        );
      }

      const outcomeText = this.formattedOutcome(reason);
      return (
        <div className="stats--control">
          <div className="control--title">
            {game.title}
            {outcomeText ? (
              <span className="control--reason">
                {" — "}
                {outcomeText}
              </span>
            ) : null}{" "}
            <TimeAgo className="control--reason" date={finishedAt} />
          </div>
          <MainAction game={game} status={status} />
        </div>
      );
    }

    const { progress = 0, bps, eta } = status.operation;

    const progressInnerStyle: React.CSSProperties = {};
    if (progress > 0) {
      progressInnerStyle.width = `${progress * 100}%`;
    } else {
      progressInnerStyle.width = `${100 / 3}%`;
    }

    return (
      <div className="stats-inner">
        <div className="game-title">{game.title}</div>
        <div className="progress">
          <div
            className={classNames("progress-inner", {
              indeterminate: !(progress > 0),
            })}
            style={progressInnerStyle}
          />
        </div>
        <div className="timeago">
          {this.formatTimeAgo()}
          <div className="filler" />
          <div>
            {operation.paused ? first ? (
              <div className="paused">
                {format(["grid.item.downloads_paused"])}
              </div>
            ) : null : (first || operation) && eta && bps ? (
              <span>{downloadProgress({ eta, bps }, operation.paused)}</span>
            ) : null}
          </div>
        </div>
      </div>
    );
  }
  formatTimeAgo() {
    const { status } = this.props;
    const { operation } = status;

    if (operation.paused) {
      return format(["grid.item.queued"]);
    }

    return <div>{this.formatOperation(operation)}</div>;
  }

  formatOperation(op: IOperation): string | JSX.Element {
    if (op.type === OperationType.Download) {
      const { item } = this.props;
      const reasonText = this.formattedReason(op.reason);
      return (
        <span>
          {format(["download.started"])}{" "}
          <TimeAgo date={new Date(item.startedAt)} />
          {reasonText ? (
            <span>
              {" — "}
              {reasonText}
            </span>
          ) : (
            ""
          )}
          {item.totalSize ? ` — ${fileSize(item.totalSize)}` : ""}
        </span>
      );
    }

    let label: ILocalizedString;
    if (op.name === "launch") {
      label = ["grid.item.running"];
    } else if (op.name === "uninstall") {
      label = ["grid.item.uninstalling"];
    } else {
      label = ["grid.item.installing"];
    }

    return format(label);
  }

  formattedReason(reason: string) {
    switch (reason) {
      case "install":
        return format(["download.reason.install"]);
      case "update":
        return format(["download.reason.update"]);
      case "reinstall":
        return format(["download.reason.reinstall"]);
      case "revert":
        return format(["download.reason.revert"]);
      case "heal":
        return format(["download.reason.heal"]);
      default:
        return null;
    }
  }

  formattedOutcome(reason: string) {
    switch (reason) {
      case "install":
        return format(["download.outcome.installed"]);
      case "update":
        return format(["download.outcome.updated"]);
      case "reinstall":
        return format(["download.outcome.reinstalled"]);
      case "revert":
        return format(["download.outcome.reverted"]);
      case "heal":
        return format(["download.outcome.healed"]);
      default:
        return null;
    }
  }
}

interface IProps extends IHoverProps {
  // TODO: first really means active, active really means !finished
  first?: boolean;
  active?: boolean;
  item: IDownloadItem;
}

interface IDerivedProps {
  status: IGameStatus;
  speeds: IDownloadSpeeds;

  downloadsPaused: boolean;
  tasksByGameId: {
    [gameId: string]: ITask[];
  };

  navigateToGame: typeof actions.navigateToGame;
  prioritizeDownload: typeof actions.prioritizeDownload;
  pauseDownloads: typeof actions.pauseDownloads;
  resumeDownloads: typeof actions.resumeDownloads;
  retryDownload: typeof actions.retryDownload;
  cancelDownload: typeof actions.cancelDownload;
  openGameContextMenu: typeof actions.openGameContextMenu;

  intl: InjectedIntl;
}

const HoverDownloadRow = Hover(DownloadRow);

export default connect<IProps>(injectIntl(HoverDownloadRow), {
  state: (rs: IRootState, props: IProps) => {
    const game = props.item.game;

    return {
      speeds: rs.downloads.speeds,
      tasksByGameId: rs.tasks.tasksByGameId,
      status: getGameStatus(rs, game),
    };
  },
  dispatch: dispatch => ({
    navigateToGame: dispatcher(dispatch, actions.navigateToGame),
    prioritizeDownload: dispatcher(dispatch, actions.prioritizeDownload),
    pauseDownloads: dispatcher(dispatch, actions.pauseDownloads),
    resumeDownloads: dispatcher(dispatch, actions.resumeDownloads),
    retryDownload: dispatcher(dispatch, actions.retryDownload),
    cancelDownload: dispatcher(dispatch, actions.cancelDownload),
    openGameContextMenu: dispatcher(dispatch, actions.openGameContextMenu),
  }),
});
