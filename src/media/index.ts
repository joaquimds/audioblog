import { ForbiddenError, NotFoundError } from "@/errors";
import * as path from "path";
import { Audio } from "../../types/audioblog";
import { exec, readDir, readFile, removeFile, writeFile } from "./util";

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
  const metadataFilenames = files.filter(
    (file) => !file.startsWith(".") && file.endsWith("json")
  );
  const audios = [];
  for (const metadataFilename of metadataFilenames) {
    const filenameParts = metadataFilename.split(".");
    filenameParts.pop();
    const basename = filenameParts.join(".");
    const webmFilename = `${basename}.webm`;
    const metadataString = await readFile(
      path.join(MEDIA_DIRECTORY, metadataFilename)
    );
    const mp3Filename = `${basename}.mp3`;
    const { author, title, emailHash, date } = JSON.parse(metadataString);
    audios.push({
      basename,
      author,
      emailHash,
      date,
      title,
      urls: {
        mp3: `/media/${mp3Filename}`,
        webm: `/media/${webmFilename}`,
      },
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
  const basename = String(now.getTime());
  const webmFilename = `${basename}.webm`;
  const metadataFilename = `${basename}.json`;
  const content = Buffer.from(await audio.arrayBuffer());
  await writeFile(path.join(MEDIA_DIRECTORY, webmFilename), content);
  await writeFile(
    path.join(MEDIA_DIRECTORY, metadataFilename),
    JSON.stringify(metadata)
  );
  await createMP3(basename);
};

const createMP3 = (basename: string) => {
  const inputPath = path.join(MEDIA_DIRECTORY, basename) + ".webm";
  const outputPath = path.join(MEDIA_DIRECTORY, basename) + ".mp3";
  const command = `ffmpeg -i "${inputPath}" -vn -ab 128k -ar 44100 -y "${outputPath}";`;
  return exec(command);
};

export const remove = async (basename: string, emailHash: string) => {
  const audios = await list();
  const matchingAudios = audios.filter((audio) => {
    return audio.basename === basename;
  });
  if (matchingAudios.length !== 1) {
    throw new NotFoundError();
  }
  const toDelete = matchingAudios[0];
  if (toDelete.emailHash !== emailHash) {
    throw new ForbiddenError();
  }
  for (const extension of ["mp3", "webm", "json"]) {
    try {
      const filename = `${basename}.${extension}`;
      await removeFile(path.join(MEDIA_DIRECTORY, filename));
    } catch (e) {
      if (e instanceof Error) {
        console.error(e.message);
      }
    }
  }
};
