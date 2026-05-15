import React from "react";
import Button from "renderer/basics/Button";
import Icon from "renderer/basics/Icon";
import Link from "renderer/basics/Link";
import { electron } from "renderer/bridge";
import styled from "renderer/styles";
import { T, _ } from "renderer/t";

const Wrapper = styled.div`
  margin: 16px 0;
  padding: 24px;
  border: 2px dashed ${(props) => props.theme.inputBorder};
  border-radius: 4px;
  background: ${(props) => props.theme.itemBackground};
  text-align: center;
  transition: border-color 0.15s, background 0.15s;

  &.dragover {
    border-color: ${(props) => props.theme.accent};
    background: rgba(255, 255, 255, 0.04);
  }
`;

const PathLine = styled.div`
  margin: 12px 0;
  font-family: monospace;
  font-size: 90%;
  color: ${(props) => props.theme.secondaryText};
  word-break: break-all;
`;

const Hint = styled.div`
  color: ${(props) => props.theme.secondaryText};
  margin-bottom: 12px;
`;

const Actions = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
`;

interface Props {
  src: string | null;
  onChange: (src: string | null) => void;
}

interface State {
  hover: boolean;
}

export default class SourcePicker extends React.PureComponent<Props, State> {
  override state: State = { hover: false };

  override render() {
    const { src } = this.props;
    return (
      <Wrapper
        className={this.state.hover ? "dragover" : ""}
        onDragOver={this.handleDragOver}
        onDragLeave={this.handleDragLeave}
        onDrop={this.handleDrop}
      >
        <Hint>
          <Icon icon="upload" /> {T(_("upload.pick_source_hint"))}
        </Hint>
        <Actions>
          <Button primary icon="folder-open" onClick={this.handleBrowseFolder}>
            {T(_("upload.select_folder"))}
          </Button>
          <Link onClick={this.handleBrowseZip}>
            {T(_("upload.select_zip"))}
          </Link>
        </Actions>
        {src ? <PathLine>{src}</PathLine> : null}
      </Wrapper>
    );
  }

  handleBrowseFolder = async () => {
    const filePaths = await electron.showOpenDialog({
      title: "Pick a folder to push",
      properties: ["openDirectory"],
    });
    if (filePaths && filePaths.length > 0) {
      this.props.onChange(filePaths[0]);
    }
  };

  handleBrowseZip = async () => {
    const filePaths = await electron.showOpenDialog({
      title: "Pick a .zip to push",
      properties: ["openFile"],
      filters: [{ name: "Archives", extensions: ["zip"] }],
    });
    if (filePaths && filePaths.length > 0) {
      this.props.onChange(filePaths[0]);
    }
  };

  handleDragOver = (ev: React.DragEvent) => {
    ev.preventDefault();
    if (!this.state.hover) this.setState({ hover: true });
  };

  handleDragLeave = () => {
    this.setState({ hover: false });
  };

  handleDrop = (ev: React.DragEvent) => {
    ev.preventDefault();
    this.setState({ hover: false });
    const file = ev.dataTransfer.files?.[0];
    if (!file) return;
    const path = electron.getPathForFile(file);
    if (path) {
      this.props.onChange(path);
    }
  };
}
