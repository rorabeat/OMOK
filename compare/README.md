# Pink Text Compare

`tkinter` desktop app for side-by-side text comparison. The left and right editors are also the result view, so differences appear inline with pink highlights like a lightweight Beyond Compare workflow.

## Run

```powershell
python main.py
```

## Features

- Paste text directly into the left and right editors
- Open `.txt` or `.log` files per side
- Drag and drop files from Windows Explorer onto the left or right pane
- Inline pink highlighting in the same editors you type into
- Shared vertical scrolling, line numbers, swap, clear, sample load, and auto compare

## Notes

- No extra packages are required.
- File drag and drop is implemented with the Windows API, so that feature is intended for Windows sessions.
- Diffing is powered by `difflib.SequenceMatcher`.
