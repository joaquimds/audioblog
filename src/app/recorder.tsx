"use client";

import { Session } from "next-auth";
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
  authorMap,
  parent,
  session,
  onSuccess,
}: {
  authorMap: { [key: string]: string };
  parent?: string;
  session: Session | null;
  onSuccess: (audio: Audio) => void;
}) => {
  const [error, setError] = useState("");
  const [isRecording, setRecording] = useState(false);
  const [audio, setAudio] = useState<Blob | null>(null);
  const [initialTitle, setInitialTitle] = useState("");
  const [isLoading, setLoading] = useState(false);
  const [volume, setVolume] = useState(0);

  useEffect(() => {
    if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) {
      setError("Audio recording not supported by this browser.");
    }
  }, [setError]);

  const toggleRecording = async () => {
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
    setError("");
    if (!audio) {
      setError("No recording to submit.");
      return;
    }
    if (!session?.emailHash) {
      setError("Your are not logged in, try refreshing the page.");
      return;
    }
    if (authorMap[author] && authorMap[author] !== session.emailHash) {
      setError("Someone has already claimed this author name.");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("author", author);
      formData.append("content", audio);
      if (parent) {
        formData.append("parent", parent);
      }
      const response = await fetch("/api/media", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        setError(`Failed to submit recording, error ${response.status}.`);
      } else {
        const audio = (await response.json()) as Audio;
        setInitialTitle("");
        setAudio(null);
        onSuccess(audio);
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
      <div className={styles.controls}>
        <button
          type="button"
          onClick={() => toggleRecording()}
          className={isRecording ? "danger" : "success"}
        >
          {isRecording ? "Stop recording" : "Start recording"}
        </button>
        {audio ? (
          <button
            type="button"
            onClick={() => setAudio(null)}
            className="danger"
          >
            Discard
          </button>
        ) : null}
      </div>
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
      {error ? <strong className="error">{error}</strong> : null}
    </div>
  );
};

export default Recorder;
