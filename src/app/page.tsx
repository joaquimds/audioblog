import { list } from "@/media";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./api/auth/[...nextauth]/route";
import Audio from "./audio";
import styles from "./page.module.css";
import Recorder from "./recorder";

const Home = async () => {
  const session = await getServerSession(authOptions);
  const audios = await list();
  audios.reverse();
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Audioblog</h1>
      <div className={styles.recorder}>
        <Recorder audios={audios} session={session} />
      </div>
      {audios.length ? (
        <>
          <h2 className={styles.title}>All blogs</h2>
          <ul className={styles.audios}>
            {audios.map((audio) => (
              <li key={audio.url} className={styles.audio}>
                <Audio audio={audio} session={session} />
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </main>
  );
};

export default Home;
