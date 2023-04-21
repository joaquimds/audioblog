export type Audio = {
  author: string;
  basename: string;
  date: string;
  emailHash: string;
  parent: string | null;
  title: string;
  urls: {
    mp3: string;
    webm: string;
  };
};

export type AudioTreeItem = Audio & { children: AudioTreeItem[] };
