import { getServerSession } from "next-auth/next";

import styles from "./page.module.css";

import { list } from "@/media";
import { authOptions } from "./api/auth/[...nextauth]/route";
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
      <h2 className={styles.title}>All blogs</h2>
      <ul>
        {audios.map(({ date, title, url }) => (
          <li key={title} className={styles.audio}>
            <div className={styles.audio__header}>
              <h3>{title}</h3>
              <small>
                {new Date(date).toLocaleDateString()}&nbsp;
                {new Date(date).toLocaleTimeString()}
              </small>
            </div>
            <audio controls src={url} />
          </li>
        ))}
      </ul>
    </main>
  );
};

export default Home;
