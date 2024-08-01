import { mainWorldSupplement } from "main/inject/inject-preload";

const supplement = (window as unknown) as typeof mainWorldSupplement;

export const url = {
  parse: supplement.nodeUrl.parse,
  format: supplement.nodeUrl.format,
};

export const querystring = {
  stringify: supplement.querystring.stringify,
  parse: supplement.querystring.parse,
};

export const electron = supplement.electron;

export const useragent = {
  userAgent: supplement.useragent.userAgent,
};

export const resources = {
  getImageURL: supplement.resources.getImageURL,
  getInjectURL: supplement.resources.getInjectURL,
};

export const paths = {
  legacyMarketPath: supplement.paths.legacyMarketPath,
  mainLogPath: supplement.paths.mainLogPath,
};

export const promisedFs = {
  readFile: supplement.promisedFs.readFile,
};

export const sysinfo = {
  cpu: supplement.sysinfo.cpu,
  graphics: supplement.sysinfo.graphics,
  osInfo: supplement.sysinfo.osInfo,
};

export const butlerd = {
  rcall: supplement.butlerd.rcall2,
  createRequest: supplement.butlerd.createRequest,
};
