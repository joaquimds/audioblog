"use client";

import { Session } from "next-auth";
import { useState } from "react";
import { Audio, AudioTreeItem } from "../../types/audioblog";
import AudioComponent from "./audio";
import styles from "./audio-list.module.css";
import Recorder from "./recorder";

const AudioList = ({
  session,
  initialAudioTree,
  authorMap,
}: {
  session: Session | null;
  initialAudioTree: AudioTreeItem[];
  authorMap: { [key: string]: string };
}) => {
  const [audioTree, setAudioTree] = useState(initialAudioTree);

  const onRecorderSuccess = (audio: Audio) => {
    const item = { ...audio, children: [] };
    setAudioTree([item, ...audioTree]);
  };

  return (
    <div className={styles["audio-list"]}>
      <div className={styles.recorder}>
        <Recorder
          authorMap={authorMap}
          session={session}
          onSuccess={onRecorderSuccess}
        />
      </div>
      {audioTree.length ? (
        <>
          <h2 className={styles.title}>All recordings</h2>
          <ul className={styles.audios}>
            {audioTree.map((audio) => (
              <li key={audio.basename} className={styles.audio}>
                <AudioComponent
                  audio={audio}
                  depth={0}
                  session={session}
                  authorMap={authorMap}
                />
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
};

export default AudioList;
