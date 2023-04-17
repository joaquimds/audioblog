import { Audio } from "@/types";
import * as crypto from "crypto";
import * as path from "path";
import { readDir, readFile, writeFile } from "./util";

const getHash = async (input: string) => {
  const textAsBuffer = new TextEncoder().encode(input);
  const hashBuffer = await crypto.webcrypto.subtle.digest(
    "SHA-256",
    textAsBuffer
  );
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray
    .map((item) => item.toString(16).padStart(2, "0"))
    .join("");
  return hash;
};

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

export const list = async (): Promise<Audio[]> => {
  const mediaDirectory = getMediaDirectory();
  const files = await readDir(mediaDirectory);
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
      path.join(mediaDirectory, metadataFilename)
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
  email: string,
  audio: Blob
) => {
  const mediaDirectory = getMediaDirectory();
  const emailHash = await getHash(email);
  const metadata = { author, title, emailHash, date: new Date().toISOString() };
  const filename = encodeURIComponent(metadata.date);
  const audioFilename = `${filename}.webm`;
  const metadataFilename = `${filename}.json`;
  const content = Buffer.from(await audio.arrayBuffer());
  await writeFile(path.join(mediaDirectory, audioFilename), content);
  await writeFile(
    path.join(mediaDirectory, metadataFilename),
    JSON.stringify(metadata)
  );
};
