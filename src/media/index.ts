import { ForbiddenError, NotFoundError } from "@/errors";
import * as path from "path";
import { Audio } from "../../types/audioblog";
import { readDir, readFile, removeFile, writeFile } from "./util";

const getMediaDirectory = () => {
  const folders = __dirname.split(path.sep);
  const rootIndex = folders.indexOf("audioblog");
  if (rootIndex === -1 || !folders.length) {
    throw new Error("Could not find media directory.");
  }
  let rootPath = folders[0];
  for (let i = 1; i <= rootIndex; i++) {
    rootPath = rootPath + path.sep + folders[i];
  }
  return path.join(rootPath, "public", "media");
};

const MEDIA_DIRECTORY = getMediaDirectory();

export const list = async (): Promise<Audio[]> => {
  const files = await readDir(MEDIA_DIRECTORY);
  files.sort();
  const audioFiles = files.filter(
    (file) => !file.startsWith(".") && !file.endsWith("json")
  );
  const audios = [];
  for (const audioFile of audioFiles) {
    const filenameParts = audioFile.split(".");
    filenameParts.pop();
    const metadataFilename = filenameParts.join(".") + ".json";
    const metadataString = await readFile(
      path.join(MEDIA_DIRECTORY, metadataFilename)
    );
    const { author, title, emailHash, date } = JSON.parse(metadataString);
    audios.push({
      author,
      emailHash,
      date,
      title,
      url: `/media/${audioFile}`,
    });
  }
  return audios;
};

export const add = async (
  author: string,
  title: string,
  emailHash: string,
  audio: Blob
) => {
  const now = new Date();
  const metadata = { author, title, emailHash, date: now.toISOString() };
  const basename = now.getTime();
  const audioFilename = `${basename}.webm`;
  const metadataFilename = `${basename}.json`;
  const content = Buffer.from(await audio.arrayBuffer());
  await writeFile(path.join(MEDIA_DIRECTORY, audioFilename), content);
  await writeFile(
    path.join(MEDIA_DIRECTORY, metadataFilename),
    JSON.stringify(metadata)
  );
};

export const remove = async (basename: string, emailHash: string) => {
  const audios = await list();
  const matchingAudios = audios.filter((audio) => {
    const urlParts = audio.url.split("/");
    const filename = urlParts.pop();
    if (!filename) {
      return false;
    }
    const filenameParts = filename.split(".");
    filenameParts.pop();
    const basenameToCheck = filenameParts.join(".");
    return basenameToCheck === basename;
  });
  if (matchingAudios.length !== 1) {
    throw new NotFoundError();
  }
  const toDelete = matchingAudios[0];
  if (toDelete.emailHash !== emailHash) {
    throw new ForbiddenError();
  }
  const urlParts = toDelete.url.split("/");
  const mediaFilename = urlParts.pop();
  if (!mediaFilename) {
    throw new NotFoundError();
  }
  const filenameParts = mediaFilename.split(".");
  filenameParts.pop();
  filenameParts.push("json");
  const metadataFilename = filenameParts.join(".");
  await removeFile(path.join(MEDIA_DIRECTORY, mediaFilename));
  await removeFile(path.join(MEDIA_DIRECTORY, metadataFilename));
};
