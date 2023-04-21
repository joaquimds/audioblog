"use client";

import { FormEvent, useState } from "react";
import styles from "./recorder-form.module.css";

const RecorderForm = ({
  isLoading,
  onSubmit,
  initialTitle,
}: {
  isLoading: boolean;
  onSubmit: (author: string, title: string) => Promise<void>;
  initialTitle: string;
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [author, setAuthor] = useState("");

  const onSubmitForm = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(author, title);
  };

  const disabled = isLoading || !author || !title;
  return (
    <form onSubmit={(e) => onSubmitForm(e)} className={styles.form}>
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
      <button disabled={disabled} className={disabled ? "" : "default"}>
        Submit
      </button>
    </form>
  );
};

export default RecorderForm;
