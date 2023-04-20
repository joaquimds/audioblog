"use client";

import { Session } from "next-auth";
import { signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { Audio } from "../../types/audioblog";
import RecorderForm from "./recorder-form";
import styles from "./recorder.module.css";

type MediaRecorderState = {
  audioBlobs: BlobPart[] | null;
  audioContext: AudioContext | null;
  mediaRecorder: MediaRecorder | null;
  stream: MediaStream | null;
};

const mediaRecorderState: MediaRecorderState = {
  audioBlobs: null,
  audioContext: null,
  mediaRecorder: null,
  stream: null,
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
  const [initialTitle, setInitialTitle] = useState("");
  const [isLoading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [volume, setVolume] = useState(0);

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
      setInitialTitle("");
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

      const audioContext = new AudioContext();
      const mediaStreamAudioSourceNode = audioContext.createMediaStreamSource(
        mediaRecorderState.stream
      );
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      const amplitudeData = new Uint8Array(bufferLength);
      mediaStreamAudioSourceNode.connect(analyser);

      const onFrame = () => {
        analyser.getByteFrequencyData(amplitudeData);
        let sumSquares = 0.0;
        amplitudeData.forEach((amplitude) => {
          sumSquares += amplitude * amplitude;
        });
        setVolume(Math.sqrt(sumSquares / amplitudeData.length));
        if (mediaRecorderState.mediaRecorder?.state === "recording") {
          window.requestAnimationFrame(onFrame);
        }
      };
      window.requestAnimationFrame(onFrame);

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

  const submitRecording = async (author: string, title: string) => {
    setSuccess("");
    setError("");
    if (!audio) {
      setError("No recording to submit.");
      return;
    }
    if (!session?.emailHash) {
      setError("Your are not logged in, try refreshing the page.");
      return;
    }
    const audiosByThisAuthor = audios.filter(
      (audio) => audio.author === author
    );
    const authorByThisAuthorButDifferentEmail = audiosByThisAuthor.filter(
      (audio) => audio.emailHash !== session.emailHash
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
        setInitialTitle("");
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
          {isRecording ? (
            <div className={styles.volume}>
              <div
                className={styles.volume__marker}
                style={{ width: volume }}
              ></div>
            </div>
          ) : null}
          {audio && !isRecording ? (
            <audio controls src={URL.createObjectURL(audio)} />
          ) : null}
          {audio ? (
            <RecorderForm
              onSubmit={(author, title) => submitRecording(author, title)}
              isLoading={isLoading}
              initialTitle={initialTitle}
            />
          ) : null}
          {success ? (
            <strong className={styles.success}>{success}</strong>
          ) : null}
          {error ? <strong className="error">{error}</strong> : null}
        </>
      )}
    </div>
  );
};

export default Recorder;
