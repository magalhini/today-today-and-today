"use client";

import { useState, useCallback, useRef, useEffect, useTransition } from "react";
import {
  saveDraftAction,
  publishPostAction,
  deletePostAction,
  updateCoverImageAction,
} from "@/lib/post-actions";
import { RichTextEditor } from "./rich-text-editor";
import { CoverImageUpload } from "./cover-image-upload";
import { AtmosphericHeader } from "./atmospheric-header";

const WORD_LIMIT = 1000;
const AUTOSAVE_DELAY = 1500;

function countWords(html: string): number {
  const stripped = html.replace(/<[^>]*>/g, " ");
  const words = stripped
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0);
  return words.length;
}

export function Editor({
  postId,
  initialTitle,
  initialBody,
  initialCoverImage,
  initialLocation,
  dateLabel,
  status: initialStatus,
}: {
  postId: number;
  initialTitle: string;
  initialBody: string;
  initialCoverImage: string | null;
  initialLocation: string | null;
  dateLabel: string;
  status: string;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);
  const [coverImage, setCoverImage] = useState<string | null>(
    initialCoverImage
  );
  const [detectedLocation, setDetectedLocation] = useState<string | null>(
    initialLocation
  );
  const [status] = useState(initialStatus);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isPublishing, startPublish] = useTransition();
  const [isDeleting, startDelete] = useTransition();

  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bodyRef = useRef(body);
  const titleRef = useRef(title);

  bodyRef.current = body;
  titleRef.current = title;

  const wordCount = countWords(body);
  const isOverLimit = wordCount > WORD_LIMIT;

  const save = useCallback(
    async (t: string, b: string) => {
      setSaveState("saving");
      setError(null);
      const result = await saveDraftAction(postId, t, b);
      if (result?.error) {
        setError(result.error);
        setSaveState("idle");
      } else {
        setSaveState("saved");
        setTimeout(() => setSaveState("idle"), 2000);
      }
    },
    [postId]
  );

  const scheduleAutosave = useCallback(
    (t: string, b: string) => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
      autosaveTimer.current = setTimeout(() => save(t, b), AUTOSAVE_DELAY);
    },
    [save]
  );

  function handleTitleChange(value: string) {
    setTitle(value);
    scheduleAutosave(value, bodyRef.current);
  }

  function handleBodyChange(html: string) {
    setBody(html);
    scheduleAutosave(titleRef.current, html);
  }

  async function handleCoverImageChange(imagePath: string | null) {
    setCoverImage(imagePath);
    await updateCoverImageAction(postId, imagePath);
  }

  function handlePublish() {
    startPublish(async () => {
      await saveDraftAction(postId, titleRef.current, bodyRef.current);
      await publishPostAction(postId);
    });
  }

  function handleDelete() {
    startDelete(async () => {
      await deletePostAction(postId);
    });
  }

  // Save on Cmd+S / Ctrl+S
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
        save(titleRef.current, bodyRef.current);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [save]);

  return (
    <div className="max-w-4xl mx-auto px-6 sm:px-10 md:px-16 py-10 md:py-16">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-10">
        <p className="text-xs uppercase tracking-[0.2em] text-charcoal-muted/60">
          Writing for {dateLabel}
          {detectedLocation && (
            <span className="text-charcoal-muted/50"> · {detectedLocation}</span>
          )}
        </p>
        <div className="flex items-center gap-4">
          <span
            className={`text-xs tabular-nums ${
              isOverLimit ? "text-error font-medium" : "text-charcoal-muted/50"
            }`}
          >
            {wordCount} / {WORD_LIMIT}
          </span>
          <span className="text-xs text-charcoal-muted/50">
            {saveState === "saving"
              ? "Saving..."
              : saveState === "saved"
              ? "Saved"
              : status === "published"
              ? "Published"
              : "Draft"}
          </span>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="text-error text-sm mb-6 font-[family-name:var(--font-body)]"
        >
          {error}
        </div>
      )}

      {/* Atmospheric header */}
      <AtmosphericHeader
        postId={postId}
        onLocationDetected={useCallback((loc: string) => setDetectedLocation(loc), [])}
      />

      {/* Cover image upload */}
      <CoverImageUpload
        currentImage={coverImage}
        onImageChange={handleCoverImageChange}
      />

      {/* Title */}
      <input
        type="text"
        value={title}
        onChange={(e) => handleTitleChange(e.target.value)}
        placeholder="Title"
        className="w-full text-3xl md:text-4xl font-[family-name:var(--font-serif)] font-semibold text-charcoal placeholder:text-charcoal-muted/25 bg-transparent border-none outline-none leading-[1.2] mb-8 focus:outline-none focus-visible:outline-none"
        aria-label="Post title"
      />

      {/* Rich text body */}
      <RichTextEditor
        initialContent={initialBody}
        onChange={handleBodyChange}
      />

      {/* Actions */}
      <div className="mt-12 pt-8 border-t border-charcoal-muted/10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {status === "draft" ? (
            <button
              onClick={handlePublish}
              disabled={
                isPublishing || isOverLimit || !title.trim() || !body.trim()
              }
              className="py-2.5 px-8 bg-charcoal text-cream text-xs uppercase tracking-[0.15em] hover:bg-charcoal-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {isPublishing ? "Publishing..." : "Publish"}
            </button>
          ) : (
            <span className="text-xs uppercase tracking-wider text-sage">
              Published
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          {showDeleteConfirm ? (
            <div className="flex items-center gap-3">
              <span className="text-xs text-charcoal-muted">
                Delete this post?
              </span>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-xs uppercase tracking-wider text-error hover:text-error/80 transition-colors"
              >
                {isDeleting ? "Deleting..." : "Yes, delete"}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="text-xs uppercase tracking-wider text-charcoal-muted hover:text-charcoal transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="text-xs uppercase tracking-wider text-charcoal-muted/50 hover:text-error transition-colors"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
