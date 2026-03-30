"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { useCallback, useState, useEffect, useRef } from "react";

export function RichTextEditor({
  initialContent,
  onChange,
}: {
  initialContent: string;
  onChange: (html: string) => void;
}) {
  const [linkUrl, setLinkUrl] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [toolbarVisible, setToolbarVisible] = useState(false);
  const [toolbarPos, setToolbarPos] = useState({ top: 0, left: 0 });
  const toolbarRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        code: false,
        horizontalRule: false,
        hardBreak: {
          keepMarks: true,
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class:
            "text-terracotta underline underline-offset-2 hover:text-terracotta-light",
        },
      }),
      Placeholder.configure({
        placeholder: "Begin writing...",
      }),
    ],
    content: initialContent || "",
    editorProps: {
      attributes: {
        class: "prose-editor min-h-[50vh] outline-none focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      if (from === to) {
        setToolbarVisible(false);
        setShowLinkInput(false);
        return;
      }
      // Position the toolbar above the selection
      const { view } = editor;
      const start = view.coordsAtPos(from);
      const end = view.coordsAtPos(to);
      const editorRect = view.dom.getBoundingClientRect();

      setToolbarPos({
        top: start.top - editorRect.top - 44,
        left: (start.left + end.left) / 2 - editorRect.left,
      });
      setToolbarVisible(true);
    },
    immediatelyRender: false,
  });

  // Hide toolbar on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        toolbarRef.current &&
        !toolbarRef.current.contains(e.target as Node)
      ) {
        setShowLinkInput(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSetLink = useCallback(() => {
    if (!editor) return;

    if (linkUrl.trim()) {
      const url = linkUrl.startsWith("http") ? linkUrl : `https://${linkUrl}`;
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: url })
        .run();
    } else {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    }

    setShowLinkInput(false);
    setLinkUrl("");
  }, [editor, linkUrl]);

  const openLinkInput = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href || "";
    setLinkUrl(previousUrl);
    setShowLinkInput(true);
  }, [editor]);

  if (!editor) {
    return (
      <div className="min-h-[50vh] text-lg font-[family-name:var(--font-body)] text-charcoal-muted/25">
        Begin writing...
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Floating toolbar — appears on text selection */}
      {toolbarVisible && (
        <div
          ref={toolbarRef}
          className="absolute z-50 flex items-center gap-0.5 bg-charcoal rounded-sm shadow-lg px-1 py-0.5"
          style={{
            top: `${toolbarPos.top}px`,
            left: `${toolbarPos.left}px`,
            transform: "translateX(-50%)",
          }}
        >
          {showLinkInput ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSetLink();
              }}
              className="flex items-center gap-1 px-1"
            >
              <input
                type="text"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="Paste link..."
                className="bg-transparent text-cream text-xs w-40 outline-none placeholder:text-cream/40 py-1"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setShowLinkInput(false);
                    setLinkUrl("");
                  }
                }}
              />
              <button
                type="submit"
                className="text-xs text-cream/60 hover:text-cream px-1"
              >
                &#8629;
              </button>
            </form>
          ) : (
            <>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleBold().run()}
                active={editor.isActive("bold")}
                label="Bold"
              >
                B
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleItalic().run()}
                active={editor.isActive("italic")}
                label="Italic"
                italic
              >
                I
              </ToolbarButton>
              <ToolbarButton
                onClick={() =>
                  editor.chain().focus().toggleBlockquote().run()
                }
                active={editor.isActive("blockquote")}
                label="Blockquote"
              >
                &ldquo;
              </ToolbarButton>
              <ToolbarButton
                onClick={openLinkInput}
                active={editor.isActive("link")}
                label="Link"
              >
                &#8596;
              </ToolbarButton>
              {editor.isActive("link") && (
                <ToolbarButton
                  onClick={() =>
                    editor
                      .chain()
                      .focus()
                      .extendMarkRange("link")
                      .unsetLink()
                      .run()
                  }
                  active={false}
                  label="Remove link"
                >
                  &times;
                </ToolbarButton>
              )}
            </>
          )}
        </div>
      )}

      <EditorContent editor={editor} />
    </div>
  );
}

function ToolbarButton({
  onClick,
  active,
  label,
  children,
  italic,
}: {
  onClick: () => void;
  active: boolean;
  label: string;
  children: React.ReactNode;
  italic?: boolean;
}) {
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      aria-label={label}
      aria-pressed={active}
      className={`w-7 h-7 flex items-center justify-center text-xs rounded-sm transition-colors ${
        italic ? "italic" : ""
      } ${
        active
          ? "bg-cream/20 text-cream"
          : "text-cream/60 hover:text-cream hover:bg-cream/10"
      }`}
    >
      {children}
    </button>
  );
}
