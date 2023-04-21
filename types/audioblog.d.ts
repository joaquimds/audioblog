export type Audio = {
  basename: string;
  author: string;
  emailHash: string;
  date: string;
  title: string;
  urls: {
    mp3: string;
    webm: string;
  };
};
