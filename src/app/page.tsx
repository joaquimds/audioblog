import { list } from "@/media";
import { getServerSession } from "next-auth/next";
import { Audio, AudioTreeItem } from "../../types/audioblog";
import { authOptions } from "./api/auth/[...nextauth]/route";
import AudioComponent from "./audio";
import Auth from "./auth";
import styles from "./page.module.css";
import Recorder from "./recorder";

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
      <h1 className={styles.title}>Audioblog</h1>
      <div className={styles.auth}>
        <Auth session={session} />
      </div>
      <div className={styles.recorder}>
        <Recorder authorMap={authorMap} session={session} />
      </div>
      {audios.length ? (
        <>
          <h2 className={styles.title}>All blogs</h2>
          <ul className={styles.audios}>
            {audioTree.map((audio) => (
              <li key={audio.basename} className={styles.audio}>
                <AudioComponent
                  audio={audio}
                  session={session}
                  authorMap={authorMap}
                />
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </main>
  );
};

export default Home;
