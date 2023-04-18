import * as fs from "fs";

export const readDir = (path: string): Promise<string[]> =>
  new Promise((resolve, reject) => {
    fs.readdir(path, (err, files) => {
      if (err) {
        return reject(err);
      }
      resolve(files);
    });
  });

export const readFile = (path: string): Promise<string> =>
  new Promise((resolve, reject) => {
    fs.readFile(path, "utf8", (err, content) => {
      if (err) {
        return reject(err);
      }
      resolve(content);
    });
  });

export const removeFile = (path: string): Promise<void> =>
  new Promise((resolve, reject) => {
    fs.unlink(path, (err) => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });

export const writeFile = (
  path: string,
  content: Buffer | string
): Promise<void> =>
  new Promise((resolve, reject) => {
    fs.writeFile(path, content, (err) => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
