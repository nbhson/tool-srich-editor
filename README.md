# SRich Editor

A lightweight, dependency-free rich text editor built with Vanilla JavaScript.

[![npm version](https://img.shields.io/npm/v/@nbhson43/s-rich-editor.svg)](https://www.npmjs.com/package/@nbhson43/s-rich-editor)
[![license](https://img.shields.io/npm/l/@nbhson43/s-rich-editor.svg)](https://github.com/nbhson/srich-editor/blob/main/LICENSE)

<p align="center">
  <img src="demo/screenshot.png" alt="SRich Editor Demo" width="100%">
</p>

## Table of Contents

- [SRich Editor](#srich-editor)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Installation](#installation)
  - [Quick Start](#quick-start)
    - [Using ES Modules (Recommended)](#using-es-modules-recommended)
    - [Using UMD (via script tag in plain HTML)](#using-umd-via-script-tag-in-plain-html)
      - [Option 1: Via CDN (unpkg / jsDelivr)](#option-1-via-cdn-unpkg--jsdelivr)
      - [Option 2: Using importmap (modern browsers, no bundler)](#option-2-using-importmap-modern-browsers-no-bundler)
  - [API](#api)
    - [`createEditor(options)`](#createeditoroptions)
      - [Options](#options)
      - [Editor Instance Methods](#editor-instance-methods)
    - [Getting Content with `getContent()`](#getting-content-with-getcontent)
      - [Using `getContent()` with onChange callback](#using-getcontent-with-onchange-callback)
  - [Custom Toolbar](#custom-toolbar)
  - [Available Toolbar Icons](#available-toolbar-icons)
  - [Keyboard Shortcuts](#keyboard-shortcuts)
  - [Comments](#comments)
    - [How to Enable](#how-to-enable)
    - [Comments API](#comments-api)
    - [CommentData Structure](#commentdata-structure)
    - [How It Works](#how-it-works)
  - [Export to PDF / Word](#export-to-pdf--word)
    - [How to Enable](#how-to-enable-1)
      - [ES Modules](#es-modules)
      - [UMD (script tag)](#umd-script-tag)
    - [How It Works](#how-it-works-1)
  - [Bundle Sizes](#bundle-sizes)
  - [Framework Integration](#framework-integration)
    - [React](#react)
    - [Vue](#vue)
    - [Angular](#angular)
      - [1. Install the package](#1-install-the-package)
      - [2. Create a wrapper component](#2-create-a-wrapper-component)
      - [3. Use in a page](#3-use-in-a-page)
  - [Development](#development)
  - [Publishing to npm](#publishing-to-npm)
  - [Project Structure](#project-structure)
  - [License](#license)

## Features

- 🚀 **Lightweight** - Tiny bundle size, only `html2pdf.js` and `docx` as optional peer dependencies
- 🎨 **Customizable** - Configurable toolbar and styling
- 🌙 **Dark Mode** - Automatic dark mode support
- ♿ **Accessible** - ARIA labels and keyboard shortcuts
- 📱 **Responsive** - Works on all screen sizes
- 🔧 **Simple API** - Easy to integrate and use
- ⌨️ **Keyboard Shortcuts** - Ctrl+B, Ctrl+I, Ctrl+U support
- 📊 **Status Bar** - Word and character count
- 💬 **Comments** - Select text to add comments, reply, resolve/delete
- 📄 **Export Word/PDF** - Export to PDF (via `html2pdf.js`) and Word `.docx` (via `docx`)

## Installation

```bash
npm install @nbhson43/s-rich-editor
```

## Quick Start

### Using ES Modules (Recommended)

```javascript
import { createEditor } from '@nbhson43/s-rich-editor';
import '@nbhson43/s-rich-editor/dist/styles.css';

const editor = createEditor({
  container: '#editor',
  placeholder: 'Start typing here...',
  onChange: (content) => {
    console.log('Content changed:', content);
  },
});

// Get content
const html = editor.getContent();

// Set content
editor.setContent('<p>Hello World</p>');
```

### Using UMD (via script tag in plain HTML)

If you're using a bundler (Webpack, Vite, Parcel, etc.), install the package and use ES Modules:

```bash
npm install @nbhson43/s-rich-editor
```

```javascript
import { createEditor } from '@nbhson43/s-rich-editor';
import '@nbhson43/s-rich-editor/dist/styles.css';

const editor = createEditor({
  container: '#editor',
  placeholder: 'Start typing here...',
});
```

#### Option 1: Via CDN (unpkg / jsDelivr)

No installation needed — just add these to your HTML `<head>`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>My Page</title>
  <!-- 1. Load CSS -->
  <link rel="stylesheet" href="https://unpkg.com/@nbhson43/s-rich-editor/dist/styles.css">
</head>
<body>
  <!-- 2. Add a container div -->
  <div id="editor"></div>

  <!-- 3. Load UMD script (exposes global `SRichEditor`) -->
  <script src="https://unpkg.com/@nbhson43/s-rich-editor/dist/srich-editor.umd.js"></script>
  <script>
    const editor = SRichEditor.createEditor({
      container: '#editor',
      placeholder: 'Start typing here...',
      onChange: (content) => console.log(content),
    });
  </script>
</body>
</html>
```

> **Note:** When using the UMD build via `<script>` tag, the library is available as the global variable `SRichEditor`. Call `SRichEditor.createEditor(...)` to create an editor instance.

#### Option 2: Using importmap (modern browsers, no bundler)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>My Page</title>
  <link rel="stylesheet" href="https://unpkg.com/@nbhson43/s-rich-editor/dist/styles.css">
</head>
<body>
  <div id="editor"></div>

  <script type="importmap">
  {
    "imports": {
      "srich-editor": "https://unpkg.com/@nbhson43/s-rich-editor/dist/srich-editor.esm.js"
    }
  }
  </script>
  <script type="module">
    import { createEditor } from '@nbhson43/s-rich-editor';

    const editor = createEditor({
      container: '#editor',
      placeholder: 'Start typing here...',
      onChange: (content) => console.log(content),
    });
  </script>
</body>
</html>
```

## API

### `createEditor(options)`

Creates a new editor instance.

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `container` | `string \| HTMLElement` | **required** | CSS selector or DOM element |
| `content` | `string` | `''` | Initial HTML content |
| `placeholder` | `string` | `'Start typing...'` | Placeholder text |
| `height` | `string` | `'300px'` | Editor height |
| `toolbar` | `ToolbarItem[]` | default toolbar | Custom toolbar config |
| `customButtons` | `CustomButton[]` | `[]` | Custom toolbar buttons |
| `readOnly` | `boolean` | `false` | Read-only mode |
| `onChange` | `(content: string) => void` | - | Content change callback |
| `onReady` | `() => void` | - | Editor ready callback |

#### Editor Instance Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `getContent()` | `string` | Get HTML content |
| `setContent(html)` | `void` | Set HTML content |
| `getText()` | `string` | Get plain text content |
| `getCharacterCount()` | `number` | Get character count |
| `getWordCount()` | `number` | Get word count |
| `execCommand(cmd, val?)` | `void` | Execute a command |
| `queryCommandState(cmd)` | `boolean` | Check if command is active |
| `focus()` | `void` | Focus the editor |
| `isEmpty()` | `boolean` | Check if editor is empty |
| `enable()` | `void` | Enable the editor |
| `disable()` | `void` | Disable the editor |
| `getElement()` | `HTMLElement` | Get wrapper element |
| `destroy()` | `void` | Remove the editor |
| `undo()` | `void` | Undo last change |
| `redo()` | `void` | Redo last undone change |
| `canUndo()` | `boolean` | Check if undo is available |
| `canRedo()` | `boolean` | Check if redo is available |

### Getting Content with `getContent()`

`getContent()` returns the current HTML content of the editor as a string. This is useful for saving or processing the editor's content.

```javascript
import { createEditor } from '@nbhson43/s-rich-editor';

const editor = createEditor({
  container: '#editor',
  placeholder: 'Start typing...',
});

// Get HTML content at any time
const html = editor.getContent();
console.log(html); // e.g. "<p>Hello <strong>World</strong></p>"

// Example: Save content on a button click
document.getElementById('save-btn').addEventListener('click', () => {
  const content = editor.getContent();
  // Send to server, save to localStorage, etc.
  fetch('/api/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
});

// Example: Check if editor has content before submitting
if (!editor.isEmpty()) {
  const html = editor.getContent();
  // proceed with form submission
}
```

#### Using `getContent()` with onChange callback

```javascript
const editor = createEditor({
  container: '#editor',
  onChange: (content) => {
    // 'content' is the same HTML string as getContent()
    console.log('Current HTML:', content);
  },
});
```

## Custom Toolbar

```javascript
import { createEditor } from '@nbhson43/s-rich-editor';
import { defaultToolbar } from '@nbhson43/s-rich-editor';

const editor = createEditor({
  container: '#editor',
  toolbar: [
    // Only show bold, italic, underline
    { type: 'button', name: 'bold', icon: 'bold', tooltip: 'Bold', command: 'bold' },
    { type: 'button', name: 'italic', icon: 'italic', tooltip: 'Italic', command: 'italic' },
    { type: 'button', name: 'underline', icon: 'underline', tooltip: 'Underline', command: 'underline' },
    { type: 'separator' },
    { type: 'button', name: 'link', icon: 'link', tooltip: 'Insert Link', command: 'createLink' },
  ],
});
```

## Available Toolbar Icons

The editor comes with 21 built-in toolbar icons:

| Icon | Command | Description |
|------|---------|-------------|
| `undo` | `undo` | Undo last action |
| `redo` | `redo` | Redo last action |
| `bold` | `bold` | Bold text |
| `italic` | `italic` | Italic text |
| `underline` | `underline` | Underline text |
| `strikethrough` | `strikeThrough` | Strikethrough text |
| `heading1` | `formatBlock: H1` | Heading level 1 |
| `heading2` | `formatBlock: H2` | Heading level 2 |
| `heading3` | `formatBlock: H3` | Heading level 3 |
| `justifyLeft` | `justifyLeft` | Align left |
| `justifyCenter` | `justifyCenter` | Align center |
| `justifyRight` | `justifyRight` | Align right |
| `unorderedList` | `insertUnorderedList` | Bullet list |
| `orderedList` | `insertOrderedList` | Numbered list |
| `blockquote` | `formatBlock: BLOCKQUOTE` | Block quote |
| `link` | `createLink` | Insert link (prompts for URL) |
| `image` | `insertImage` | Insert image (prompts for URL) |
| `horizontalRule` | `insertHorizontalRule` | Horizontal line |
| `code` | `formatBlock: PRE` | Code block |
| `removeFormat` | `removeFormat` | Clear formatting |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+B | Bold |
| Ctrl+I | Italic |
| Ctrl+U | Underline |
| Ctrl+Z | Undo |
| Ctrl+Y | Redo |
| Ctrl+Shift+Z | Redo (Mac) |

## Comments

Enable a full commenting system — select text to add comments, reply, resolve, or delete.

### How to Enable

Pass a `comments` option when creating the editor. A 💬 **Comments** button will automatically appear in the toolbar.

```javascript
// ES Modules
import { createEditor } from '@nbhson43/s-rich-editor';
import '@nbhson43/s-rich-editor/dist/styles.css';

const editor = createEditor({
  container: '#editor',
  comments: {
    userName: 'Alice',               // Required — your display name
    onCommentsChange: (comments) => {
      console.log('Comments:', comments);
      // Save to localStorage, database, etc.
    },
  },
});
```

```html
<!-- UMD (script tag) — no extra dependencies needed -->
<script src="dist/srich-editor.umd.js"></script>
<script>
  var editor = SRichEditor.createEditor({
    container: '#editor',
    comments: {
      userName: 'Alice',
      onCommentsChange: function (comments) {
        console.log('Comments:', comments);
      },
    },
  });
</script>
```

### Comments API

| Method | Description |
|--------|-------------|
| `editor.getComments()` | Returns `CommentData[]` — all comments |
| `editor.setComments(comments)` | Replace all comments (e.g. load from server) |
| `editor.toggleSidebar()` | Open/close the comments sidebar panel |

### CommentData Structure

```typescript
interface CommentData {
  id: string;
  author: string;
  content: string;
  timestamp: number;
  selectedText: string;
  resolved: boolean;
  replies: CommentReplyData[];
}

interface CommentReplyData {
  id: string;
  author: string;
  content: string;
  timestamp: number;
}
```

### How It Works

1. **Select text** in the editor, then click the 💬 **Comments** button in the toolbar
2. A dialog appears — type your comment and click **Confirm**
3. The selected text is highlighted in yellow
4. The **Comments Sidebar** opens on the right, showing all comments
5. Click a comment to **Reply**, **Resolve**, or **Delete** it
6. Resolved comments remove the highlight; unresolved ones restore it

## Export to PDF / Word

Export the editor content as PDF or Word `.docx` files.

### How to Enable

Pass an `export` option when creating the editor. 📄 **PDF** and 📝 **Word** buttons will automatically appear in the toolbar.

#### ES Modules

```bash
# Install export dependencies
npm install html2pdf.js docx file-saver
```

```javascript
import { createEditor } from '@nbhson43/s-rich-editor';
import '@nbhson43/s-rich-editor/dist/styles.css';

const editor = createEditor({
  container: '#editor',
  export: {
    documentTitle: 'My Document',   // File name for exports
    pdf: true,                       // Show PDF button (default: true)
    word: true,                      // Show Word button (default: true)
  },
});
```

#### UMD (script tag)

Include these **before** the editor script:

```html
<!-- PDF export (html2pdf.js) -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.2/html2pdf.bundle.min.js"></script>

<!-- Word export (docx + file-saver) -->
<script src="https://cdn.jsdelivr.net/npm/docx/build/index.umd.js"></script>
<script src="https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js"></script>

<!-- SRich Editor -->
<script src="https://unpkg.com/@nbhson43/s-rich-editor/dist/srich-editor.umd.js"></script>
<script>
  var editor = SRichEditor.createEditor({
    container: '#editor',
    export: { documentTitle: 'My Document' },
  });
</script>
```

### How It Works

| Button | What It Does | Library |
|--------|-------------|---------|
| 📄 **Export PDF** | Renders HTML → canvas → PDF with A4 format | `html2pdf.js` |
| 📝 **Export Word** | Generates Office Open XML `.docx` file | `docx` + `file-saver` |

- **PDF**: Uses `html2pdf.js` to render the editor content as a PDF with margins, JPEG quality, and A4 page format.
- **Word**: Parses the DOM tree (headings, bold, italic, underline, lists, tables, etc.) and generates a proper `.docx` file using the `docx` library.
- **Word fallback**: If `docx` is not loaded, falls back to a basic HTML `.doc` file that Word can open.

## Bundle Sizes

| File | Size | Format |
|------|------|--------|
| `srich-editor.umd.js` | ~24 KB | UMD (script tags) |
| `srich-editor.esm.js` | ~24 KB | ES Modules |
| `styles.css` | ~8 KB | CSS |
| **Total package** | **~24 KB** | minified |

## Framework Integration

### React

```jsx
import { useEffect, useRef } from 'react';
import { createEditor } from '@nbhson43/s-rich-editor';
import '@nbhson43/s-rich-editor/dist/styles.css';

function SRichEditor({ onChange }) {
  const containerRef = useRef(null);
  const editorRef = useRef(null);

  useEffect(() => {
    editorRef.current = createEditor({
      container: containerRef.current,
      onChange,
    });
    return () => editorRef.current?.destroy();
  }, []);

  return <div ref={containerRef} />;
}
```

### Vue

```vue
<template>
  <div ref="editorContainer"></div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import { createEditor } from '@nbhson43/s-rich-editor';
import '@nbhson43/s-rich-editor/dist/styles.css';

const editorContainer = ref(null);
let editor = null;

onMounted(() => {
  editor = createEditor({
    container: editorContainer.value,
    onChange: (content) => console.log(content),
  });
});

onUnmounted(() => editor?.destroy());
</script>
```

### Angular

#### 1. Install the package

```bash
npm install @nbhson43/s-rich-editor
```

#### 2. Create a wrapper component

**srich-editor.component.ts**

```typescript
import {
  Component,
  ElementRef,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  AfterViewInit,
  Input,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { createEditor, RichEditorInstance } from '@nbhson43/s-rich-editor';
import '@nbhson43/s-rich-editor/dist/styles.css';

@Component({
  selector: 'app-srich-editor',
  standalone: true,
  imports: [CommonModule],
  template: `<div #editorContainer></div>`,
  styles: [`:host { display: block; }`],
})
export class SRichEditorComponent implements AfterViewInit, OnDestroy {
  @ViewChild('editorContainer', { static: true }) editorContainer!: ElementRef;
  @Output() contentChanged = new EventEmitter<string>();
  @Input() placeholder = 'Start typing...';
  @Input() height = '300px';
  @Input() content = '';

  private editor!: RichEditorInstance;

  ngAfterViewInit(): void {
    this.editor = createEditor({
      container: this.editorContainer.nativeElement,
      placeholder: this.placeholder,
      height: this.height,
      content: this.content,
      onChange: (html: string) => this.contentChanged.emit(html),
    });
  }

  getContent(): string {
    return this.editor?.getContent() ?? '';
  }

  setContent(html: string): void {
    this.editor?.setContent(html);
  }

  ngOnDestroy(): void {
    this.editor?.destroy();
  }
}
```

#### 3. Use in a page

**app.component.ts**

```typescript
import { Component } from '@angular/core';
import { SRichEditorComponent } from './srich-editor.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [SRichEditorComponent],
  template: `
    <app-srich-editor
      placeholder="Write something..."
      (contentChanged)="onContentChange($event)">
    </app-srich-editor>
  `,
})
export class AppComponent {
  onContentChange(content: string) {
    console.log('Content:', content);
  }
}
```
## Development

```bash
# Install dependencies
npm install

# Development mode with watch
npm run dev

# Build for production
npm run build

# Run unit tests
npx vitest run

# Run E2E tests (requires build first)
npm run build && npx playwright test

# Open demo
npm run demo
```

## Publishing to npm

```bash
# Login to npm
npm login

# (Optional) Dry run to check what will be published
npm pack --dry-run

# Publish
npm publish

# Publish with tag
npm publish --tag beta

# Update version and publish
npm version patch  # or minor / major
npm publish
```

## Project Structure

```
srichEditor/
├── src/
│   ├── index.ts          # Entry point, exports
│   ├── types.ts          # TypeScript interfaces
│   ├── toolbar.ts        # Toolbar config + SVG icons
│   ├── editor.ts         # Core editor logic
│   ├── comments.ts       # Comments system (sidebar, highlights)
│   ├── comments.test.ts  # Unit tests for comments module
│   ├── editor.test.ts    # Unit tests for editor core
│   ├── toolbar.test.ts   # Unit tests for toolbar config
│   ├── color-picker.test.ts # Unit tests for color picker
│   ├── export.ts         # Export to PDF / Word
│   ├── sanitizer.ts      # HTML sanitizer (XSS protection)
│   ├── sanitizer.test.ts # Unit tests for sanitizer
│   ├── dialog.ts         # Link tooltip & image dialog
│   ├── color-picker.ts   # Color picker UI
│   ├── styles.css        # Editor styles (light + dark mode)
│   └── global.d.ts       # CSS module declaration
├── e2e/
│   ├── editor.spec.ts    # Playwright E2E tests
│   ├── test-page.html    # E2E test page
│   └── server.js         # Dev server for E2E
├── dist/                 # Build output (git-ignored)
├── demo/
│   └── index.html        # Demo page
├── package.json
├── rollup.config.mjs     # Rollup build config
├── tsconfig.json         # TypeScript config
├── vitest.config.ts      # Vitest config (unit tests)
├── playwright.config.ts  # Playwright config (E2E tests)
├── .gitignore
└── README.md
```

## License

MIT