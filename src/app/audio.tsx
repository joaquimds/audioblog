"use client";

import { Session } from "next-auth";
import { SyntheticEvent, useEffect, useState } from "react";
import { Audio, AudioTreeItem } from "../../types/audioblog";
import styles from "./audio.module.css";
import Recorder from "./recorder";

const Audio = ({
  audio: {
    basename,
    children: initialChildren,
    title,
    author,
    date,
    emailHash,
    urls,
  },
  authorMap,
  depth,
  session,
}: {
  audio: AudioTreeItem;
  authorMap: { [key: string]: string };
  depth: number,
  session: Session | null;
}) => {
  const [error, setError] = useState("");
  const [isLoading, setLoading] = useState(false);
  const [isResponding, setResponding] = useState(false);
  const [isRenderedOnClient, setRenderedOnClient] = useState(false);
  const [children, setChildren] = useState(initialChildren);

  // Hack to make sure onLoadedMetadata fires, which fixes the audio duration
  useEffect(() => {
    if (typeof window !== "undefined") {
      setRenderedOnClient(true);
    }
  }, []);

  const deleteAudio = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(`/api/media/${basename}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        setError(`Failed to delete recording, error ${response.status}.`);
      } else {
        setError("Deleted recording, reloading...");
        setTimeout(() => location.reload(), 2000);
      }
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("Unknown error deleting recording.");
      }
    }
    setLoading(false);
  };

  // Hack to display the correct duration of the audio
  const onLoadedMetadata = (e: SyntheticEvent<HTMLAudioElement>) => {
    const audio = e.target as HTMLAudioElement;
    if (audio.duration === Infinity) {
      const backToStart = () => {
        audio.currentTime = 0;
        audio.removeEventListener("timeupdate", backToStart);
      };
      audio.addEventListener("timeupdate", backToStart);
      audio.currentTime = 1e101;
    }
  };

  const onRecorderSuccess = (audio: Audio) => {
    const item = { ...audio, children: [] };
    setResponding(false)
    setChildren([item, ...children]);
  };

  // Formatted date on server is inconsistent and cba to fix it
  // Plus having a loading indicator while the audio isn't ready isn't so bad
  const formattedDate = !isRenderedOnClient
    ? "Loading..."
    : `
    ${new Date(date).toLocaleDateString()}
    ${new Date(date).toLocaleTimeString()}
  `.trim();

  const backgroundDepth = depth === 0 ? 1 : depth + 3; // Skip depth = 2,3 because they looks bad
  const childBackgroundValue = 255 - (backgroundDepth) * 5;
  const childBackground = (
    `rgb(${childBackgroundValue},${childBackgroundValue},${childBackgroundValue})`
  )

  return (
    <div className={styles.audio}>
      <div className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
        <em className={styles.author}>{author}</em>
        <small className={styles.date}>{formattedDate}</small>
      </div>
      <div className={styles.controls}>
        <audio controls onLoadedMetadata={onLoadedMetadata}>
          {isRenderedOnClient ? <source src={urls.webm} /> : null}
          {isRenderedOnClient ? <source src={urls.mp3} /> : null}
        </audio>
        <div className={styles.buttons}>
          {session?.emailHash ? (
            <button
              type="button"
              onClick={() => setResponding(!isResponding)}
              className={`${styles.respond} default`}
              disabled={isLoading}
            >
              {isResponding ? "Cancel": "Respond"}
            </button>
          ) : null}
          {session?.isAdmin || session?.emailHash === emailHash ? (
            <button
              type="button"
              onClick={() => deleteAudio()}
              className="danger"
              disabled={isLoading}
            >
              Delete
            </button>
          ) : null}
        </div>
      </div>
      {error ? (
        <strong className={`error ${styles.error}`}>{error}</strong>
      ) : null}
      {isResponding ? (
        <Recorder
          session={session}
          authorMap={authorMap}
          parent={basename}
          onSuccess={onRecorderSuccess}
        />
      ) : null}
      {children.length ? (
        <ul className={styles.children} style={{ backgroundColor: childBackground }}>
          {children.map((child) => (
            <li key={child.basename}>
              <Audio audio={child} session={session} authorMap={authorMap} depth={depth + 1} />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
};

export default Audio;
