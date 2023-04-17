"use client";

import { Audio } from "@/types";
import { Session } from "next-auth";
import { signIn, signOut } from "next-auth/react";
import { FormEvent, useEffect, useState } from "react";

import styles from "./recorder.module.css";

type MediaRecorderState = {
  stream: MediaStream | null;
  mediaRecorder: MediaRecorder | null;
  audioBlobs: BlobPart[] | null;
};

const mediaRecorderState: MediaRecorderState = {
  stream: null,
  mediaRecorder: null,
  audioBlobs: null,
};

const getHash = async (input: string) => {
  const textAsBuffer = new TextEncoder().encode(input);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", textAsBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray
    .map((item) => item.toString(16).padStart(2, "0"))
    .join("");
  return hash;
};

const Recorder = ({
  audios,
  session,
}: {
  audios: Audio[];
  session: Session | null;
}) => {
  const [error, setError] = useState("");
  const [isRecording, setRecording] = useState(false);
  const [audio, setAudio] = useState<Blob | null>(null);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [isLoading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) {
      setError("Audio recording not supported by this browser.");
    }
  }, [setError]);

  const toggleRecording = async () => {
    setSuccess("");
    setError("");
    if (isRecording) {
      await stopRecording();
    } else {
      setTitle("");
      await startRecording();
    }
  };

  const startRecording = async () => {
    try {
      mediaRecorderState.stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      mediaRecorderState.mediaRecorder = new MediaRecorder(
        mediaRecorderState.stream
      );
      mediaRecorderState.audioBlobs = [];

      mediaRecorderState.mediaRecorder.addEventListener(
        "dataavailable",
        (event) => {
          if (!mediaRecorderState.audioBlobs) {
            mediaRecorderState.audioBlobs = [];
          }
          mediaRecorderState.audioBlobs.push(event.data);
        }
      );

      mediaRecorderState.mediaRecorder.start();

      setRecording(true);
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("Unknown error starting recording.");
      }
    }
  };

  const stopRecording = async () => {
    try {
      const audio = await stopMediaRecorder();
      setAudio(audio);
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("Unknown error stopping recording.");
      }
    }
    setRecording(false);
  };

  const stopMediaRecorder = (): Promise<Blob> =>
    new Promise((resolve, reject) => {
      if (!mediaRecorderState.mediaRecorder || !mediaRecorderState.stream) {
        reject("Unexpected media recorder state, please try again.");
        return;
      }
      const mimeType = mediaRecorderState.mediaRecorder.mimeType;
      mediaRecorderState.mediaRecorder.addEventListener("stop", () => {
        const audioBlob = new Blob(mediaRecorderState.audioBlobs || [], {
          type: mimeType,
        });
        resolve(audioBlob);
      });
      mediaRecorderState.mediaRecorder.stop();
      mediaRecorderState.stream.getTracks().forEach((track) => track.stop());
      mediaRecorderState.stream = null;
      mediaRecorderState.mediaRecorder = null;
      mediaRecorderState.audioBlobs = [];
    });

  const submitRecording = async (e: FormEvent) => {
    e.preventDefault();
    setSuccess("");
    setError("");
    if (!audio) {
      setError("No recording to submit.");
      return;
    }
    if (!session?.user?.email) {
      setError("Your are not logged in, try refreshing the page.");
      return;
    }
    const emailHash = await getHash(session.user.email);
    const audiosByThisAuthor = audios.filter(
      (audio) => audio.author === author
    );
    const authorByThisAuthorButDifferentEmail = audiosByThisAuthor.filter(
      (audio) => audio.emailHash !== emailHash
    );
    if (authorByThisAuthorButDifferentEmail.length > 0) {
      setError("Someone has already claimed this author name.");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("author", author);
      formData.append("content", audio);
      const response = await fetch("/api/media", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        setError(`Failed to submit recording, error ${response.status}.`);
      } else {
        setSuccess(`Submitted recording with title ${title}! Reloading...`);
        setTitle("");
        setAudio(null);
        setTimeout(() => location.reload(), 3000);
      }
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("Unknown error submitting recording.");
      }
    }
    setLoading(false);
  };

  const submitDisabled = isLoading || !title || !author;
  return (
    <div className={styles.recorder}>
      {!session ? (
        <button type="button" onClick={() => signIn()} className="default">
          Log in
        </button>
      ) : (
        <>
          <button
            type="button"
            onClick={() => signOut()}
            className={`${styles["log-out"]} danger`}
          >
            Log out
          </button>
          <button
            type="button"
            onClick={() => toggleRecording()}
            className={isRecording ? "danger" : "success"}
          >
            {isRecording ? "Stop recording" : "Start recording"}
          </button>
          {audio ? <audio controls src={URL.createObjectURL(audio)} /> : null}
          {audio ? (
            <form onSubmit={(e) => submitRecording(e)} className={styles.form}>
              <label htmlFor="title">Title</label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <label htmlFor="author">Author</label>
              <input
                id="author"
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
              />
              <button
                disabled={submitDisabled}
                className={submitDisabled ? "" : "default"}
              >
                Submit
              </button>
            </form>
          ) : null}
          {success ? (
            <strong className={styles.success}>{success}</strong>
          ) : null}
          {error ? <strong className={styles.error}>{error}</strong> : null}
        </>
      )}
    </div>
  );
};

export default Recorder;
