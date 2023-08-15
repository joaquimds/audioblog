import { list } from "@/media";
import { getServerSession } from "next-auth/next";
import { Audio, AudioTreeItem } from "../../types/audioblog";
import { authOptions } from "./api/auth/[...nextauth]/route";
import AudioList from "./audio-list";
import Auth from "./auth";
import styles from "./page.module.css";

const getAudioTree = (audios: Audio[]): AudioTreeItem[] => {
  for (const audio of audios) {
    (audio as AudioTreeItem).children = [];
  }
  const audioTreeItems = audios as AudioTreeItem[];
  for (const audio of audioTreeItems) {
    if (audio.parent) {
      const parent = audioTreeItems.find(
        (parent) => parent.basename === audio.parent
      );
      if (parent) {
        parent.children.push(audio);
      }
    }
  }
  return audioTreeItems.filter((a) => !a.parent);
};

const Home = async () => {
  const session = await getServerSession(authOptions);
  const audios = await list();
  const audioTree = getAudioTree(audios);
  const authorMap = audios.reduce((map, audio) => {
    return { ...map, [audio.author]: audio.emailHash };
  }, {});
  return (
    <main className={`${styles.main} main`}>
      <h1 className={styles.title}>Spoken Words</h1>
      <div className={styles.auth}>
        <Auth session={session} />
      </div>
      <AudioList
        session={session}
        initialAudioTree={audioTree}
        authorMap={authorMap}
      />
    </main>
  );
};

export default Home;
