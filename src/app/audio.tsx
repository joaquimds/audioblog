"use client";

import { Session } from "next-auth";
import { useState } from "react";
import { Audio } from "../../types/audioblog";
import styles from "./audio.module.css";

const Audio = ({
  audio: { title, author, date, emailHash, url },
  session,
}: {
  audio: Audio;
  session: Session | null;
}) => {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const deleteAudio = async (url: string) => {
    try {
      const urlParts = url.split("/");
      const filename = urlParts.pop();
      if (!filename) {
        return;
      }
      const filenameParts = filename.split(".");
      filenameParts.pop();
      const basename = filenameParts.join(".");
      setLoading(true);
      setError("");
      const response = await fetch(`/api/media/${basename}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        setError(`Failed to delete recording, error ${response.status}.`);
      } else {
        setError("Deleted recording, reloading...");
        setTimeout(() => location.reload(), 3000);
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

  return (
    <div className={styles.audio}>
      <div className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
        <em className={styles.author}>{author}</em>
        <small className={styles.date}>
          {new Date(date).toLocaleDateString()}&nbsp;
          {new Date(date).toLocaleTimeString()}
        </small>
      </div>
      <div className={styles.controls}>
        <audio controls src={url} />
        {session?.isAdmin || session?.emailHash === emailHash ? (
          <button
            type="button"
            onClick={() => deleteAudio(url)}
            className="danger"
            disabled={loading}
          >
            Delete
          </button>
        ) : null}
      </div>
      {error ? (
        <strong className={`error ${styles.error}`}>{error}</strong>
      ) : null}
    </div>
  );
};

export default Audio;
