from __future__ import annotations

import sys
from dataclasses import dataclass
from difflib import SequenceMatcher
from pathlib import Path
import tkinter as tk
from tkinter import filedialog, font as tkfont, messagebox, ttk


APP_TITLE = "Pink Text Compare"
WINDOW_SIZE = "1500x900"
MIN_WINDOW_SIZE = (1180, 760)
AUTO_COMPARE_DELAY_MS = 300
READ_ENCODINGS = ("utf-8-sig", "utf-8", "cp949", "euc-kr")

LEFT_SAMPLE = """[INFO] compare engine started
name=alpha-service
port=8080
timeout=30
feature_flag=off
"""

RIGHT_SAMPLE = """[INFO] compare engine started
name=alpha-service
port=9090
timeout=45
feature_flag=on
extra_note=enabled
"""

if sys.platform == "win32":
    import ctypes
    from ctypes import wintypes

    user32 = ctypes.WinDLL("user32", use_last_error=True)
    shell32 = ctypes.WinDLL("shell32", use_last_error=True)

    GWL_WNDPROC = -4
    WM_DROPFILES = 0x0233
    LONG_PTR = ctypes.c_ssize_t

    class POINT(ctypes.Structure):
        _fields_ = [("x", wintypes.LONG), ("y", wintypes.LONG)]

    WNDPROC = ctypes.WINFUNCTYPE(LONG_PTR, wintypes.HWND, wintypes.UINT, wintypes.WPARAM, wintypes.LPARAM)

    user32.SetWindowLongPtrW.argtypes = [wintypes.HWND, ctypes.c_int, LONG_PTR]
    user32.SetWindowLongPtrW.restype = LONG_PTR
    user32.CallWindowProcW.argtypes = [LONG_PTR, wintypes.HWND, wintypes.UINT, wintypes.WPARAM, wintypes.LPARAM]
    user32.CallWindowProcW.restype = LONG_PTR
    user32.ClientToScreen.argtypes = [wintypes.HWND, ctypes.POINTER(POINT)]
    user32.ClientToScreen.restype = wintypes.BOOL

    shell32.DragAcceptFiles.argtypes = [wintypes.HWND, wintypes.BOOL]
    shell32.DragAcceptFiles.restype = None
    shell32.DragQueryFileW.argtypes = [wintypes.HANDLE, wintypes.UINT, wintypes.LPWSTR, wintypes.UINT]
    shell32.DragQueryFileW.restype = wintypes.UINT
    shell32.DragQueryPoint.argtypes = [wintypes.HANDLE, ctypes.POINTER(POINT)]
    shell32.DragQueryPoint.restype = wintypes.BOOL
    shell32.DragFinish.argtypes = [wintypes.HANDLE]
    shell32.DragFinish.restype = None


@dataclass
class DiffRow:
    left_line_no: int | None
    right_line_no: int | None
    left_segments: list[tuple[str, bool]]
    right_segments: list[tuple[str, bool]]
    changed: bool


@dataclass
class EditorPane:
    side: str
    frame: ttk.Frame
    gutter: tk.Text
    text: tk.Text
    path_var: tk.StringVar


def normalize_text(value: str) -> str:
    return value.replace("\r\n", "\n").replace("\r", "\n")


def split_lines(value: str) -> list[str]:
    normalized = normalize_text(value)
    if not normalized:
        return []
    return normalized.split("\n")


def merge_segments(segments: list[tuple[str, bool]]) -> list[tuple[str, bool]]:
    merged: list[tuple[str, bool]] = []
    for text, is_diff in segments:
        if not text:
            continue
        if merged and merged[-1][1] == is_diff:
            previous, _ = merged[-1]
            merged[-1] = (previous + text, is_diff)
            continue
        merged.append((text, is_diff))
    return merged


def diff_segments(left: str, right: str) -> tuple[list[tuple[str, bool]], list[tuple[str, bool]]]:
    matcher = SequenceMatcher(None, left, right, autojunk=False)
    left_segments: list[tuple[str, bool]] = []
    right_segments: list[tuple[str, bool]] = []

    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        if tag == "equal":
            equal_text = left[i1:i2]
            left_segments.append((equal_text, False))
            right_segments.append((equal_text, False))
        elif tag == "replace":
            left_segments.append((left[i1:i2], True))
            right_segments.append((right[j1:j2], True))
        elif tag == "delete":
            left_segments.append((left[i1:i2], True))
        elif tag == "insert":
            right_segments.append((right[j1:j2], True))

    return merge_segments(left_segments), merge_segments(right_segments)


def make_equal_row(left_line_no: int, right_line_no: int, text: str) -> DiffRow:
    segments = [(text, False)] if text else []
    return DiffRow(
        left_line_no=left_line_no,
        right_line_no=right_line_no,
        left_segments=segments,
        right_segments=segments.copy(),
        changed=False,
    )


def make_left_only_row(line_no: int, text: str) -> DiffRow:
    return DiffRow(
        left_line_no=line_no,
        right_line_no=None,
        left_segments=[(text, True)] if text else [],
        right_segments=[],
        changed=True,
    )


def make_right_only_row(line_no: int, text: str) -> DiffRow:
    return DiffRow(
        left_line_no=None,
        right_line_no=line_no,
        left_segments=[],
        right_segments=[(text, True)] if text else [],
        changed=True,
    )


def build_replace_rows(
    left_block: list[str],
    right_block: list[str],
    left_start_line: int,
    right_start_line: int,
) -> list[DiffRow]:
    rows: list[DiffRow] = []
    matcher = SequenceMatcher(None, left_block, right_block, autojunk=False)

    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        if tag == "equal":
            for offset, line_text in enumerate(left_block[i1:i2]):
                rows.append(
                    make_equal_row(
                        left_line_no=left_start_line + i1 + offset,
                        right_line_no=right_start_line + j1 + offset,
                        text=line_text,
                    )
                )
            continue

        if tag == "delete":
            for offset, line_text in enumerate(left_block[i1:i2]):
                rows.append(make_left_only_row(left_start_line + i1 + offset, line_text))
            continue

        if tag == "insert":
            for offset, line_text in enumerate(right_block[j1:j2]):
                rows.append(make_right_only_row(right_start_line + j1 + offset, line_text))
            continue

        left_count = i2 - i1
        right_count = j2 - j1
        pair_count = max(left_count, right_count)

        for offset in range(pair_count):
            left_index = i1 + offset if offset < left_count else None
            right_index = j1 + offset if offset < right_count else None

            if left_index is None:
                rows.append(make_right_only_row(right_start_line + right_index, right_block[right_index]))
                continue

            if right_index is None:
                rows.append(make_left_only_row(left_start_line + left_index, left_block[left_index]))
                continue

            left_text = left_block[left_index]
            right_text = right_block[right_index]
            left_segments, right_segments = diff_segments(left_text, right_text)
            rows.append(
                DiffRow(
                    left_line_no=left_start_line + left_index,
                    right_line_no=right_start_line + right_index,
                    left_segments=left_segments,
                    right_segments=right_segments,
                    changed=True,
                )
            )

    return rows


def build_diff_rows(left_text: str, right_text: str) -> list[DiffRow]:
    left_lines = split_lines(left_text)
    right_lines = split_lines(right_text)
    rows: list[DiffRow] = []
    matcher = SequenceMatcher(None, left_lines, right_lines, autojunk=False)

    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        if tag == "equal":
            for offset, line_text in enumerate(left_lines[i1:i2]):
                rows.append(make_equal_row(i1 + offset + 1, j1 + offset + 1, line_text))
            continue

        if tag == "delete":
            for offset, line_text in enumerate(left_lines[i1:i2]):
                rows.append(make_left_only_row(i1 + offset + 1, line_text))
            continue

        if tag == "insert":
            for offset, line_text in enumerate(right_lines[j1:j2]):
                rows.append(make_right_only_row(j1 + offset + 1, line_text))
            continue

        rows.extend(
            build_replace_rows(
                left_block=left_lines[i1:i2],
                right_block=right_lines[j1:j2],
                left_start_line=i1 + 1,
                right_start_line=j1 + 1,
            )
        )

    return rows


def read_text_file(path: Path) -> str:
    for encoding in READ_ENCODINGS:
        try:
            return path.read_text(encoding=encoding)
        except UnicodeDecodeError:
            continue

    return path.read_text(encoding="utf-8", errors="replace")


def line_count_for_text(value: str) -> int:
    return max(1, len(split_lines(value)))


class WindowsFileDropSupport:
    def __init__(self, app: "TextCompareApp") -> None:
        self.app = app
        self.enabled = False
        self.hwnd: int | None = None
        self.old_wndproc: int | None = None
        self.new_wndproc = None

    def install(self) -> bool:
        if sys.platform != "win32":
            return False

        self.app.update_idletasks()
        self.hwnd = self.app.winfo_id()
        shell32.DragAcceptFiles(self.hwnd, True)
        self.new_wndproc = WNDPROC(self._wndproc)
        previous = user32.SetWindowLongPtrW(
            self.hwnd,
            GWL_WNDPROC,
            ctypes.cast(self.new_wndproc, ctypes.c_void_p).value,
        )

        if previous == 0 and ctypes.get_last_error() != 0:
            shell32.DragAcceptFiles(self.hwnd, False)
            raise ctypes.WinError(ctypes.get_last_error())

        self.old_wndproc = previous
        self.enabled = True
        return True

    def uninstall(self) -> None:
        if not self.enabled or self.hwnd is None or self.old_wndproc is None:
            return

        user32.SetWindowLongPtrW(self.hwnd, GWL_WNDPROC, self.old_wndproc)
        shell32.DragAcceptFiles(self.hwnd, False)
        self.enabled = False

    def _wndproc(self, hwnd: int, message: int, wparam: int, lparam: int) -> int:
        if message == WM_DROPFILES:
            files, screen_x, screen_y = self._read_drop_files(wparam)
            self.app.after(0, lambda: self.app.handle_file_drop(files, screen_x, screen_y))
            return 0

        if self.old_wndproc is None:
            return 0
        return user32.CallWindowProcW(self.old_wndproc, hwnd, message, wparam, lparam)

    def _read_drop_files(self, hdrop: int) -> tuple[list[Path], int, int]:
        file_count = shell32.DragQueryFileW(hdrop, 0xFFFFFFFF, None, 0)
        files: list[Path] = []

        for index in range(file_count):
            length = shell32.DragQueryFileW(hdrop, index, None, 0)
            buffer = ctypes.create_unicode_buffer(length + 1)
            shell32.DragQueryFileW(hdrop, index, buffer, length + 1)
            files.append(Path(buffer.value))

        point = POINT()
        shell32.DragQueryPoint(hdrop, ctypes.byref(point))
        user32.ClientToScreen(self.hwnd, ctypes.byref(point))
        shell32.DragFinish(hdrop)
        return files, point.x, point.y


class TextCompareApp(tk.Tk):
    def __init__(self) -> None:
        super().__init__()
        self.title(APP_TITLE)
        self.geometry(WINDOW_SIZE)
        self.minsize(*MIN_WINDOW_SIZE)
        self.configure(bg="#f6eef3")

        self.pending_compare_id: str | None = None
        self.syncing_vertical = False
        self.auto_compare = tk.BooleanVar(value=True)
        self.status_var = tk.StringVar(value="Paste text or drop .txt files onto the left and right panes.")

        self._configure_style()
        self._build_ui()
        self._bind_shortcuts()

        self.drop_support = WindowsFileDropSupport(self)
        self.drop_enabled = False
        self.protocol("WM_DELETE_WINDOW", self.on_close)
        self.after(50, self._finish_startup)

    def _configure_style(self) -> None:
        style = ttk.Style(self)
        if "clam" in style.theme_names():
            style.theme_use("clam")

        style.configure(".", background="#f6eef3", foreground="#2d2430")
        style.configure("Shell.TFrame", background="#f6eef3")
        style.configure("Card.TFrame", background="#fff9fc")
        style.configure("Card.TLabelframe", background="#fff9fc", relief="solid", borderwidth=1)
        style.configure("Card.TLabelframe.Label", background="#fff9fc", foreground="#2d2430")
        style.configure("Title.TLabel", background="#f6eef3", foreground="#2d2430", font=("Segoe UI", 21, "bold"))
        style.configure("SubTitle.TLabel", background="#f6eef3", foreground="#6e5d69", font=("Segoe UI", 10))
        style.configure("PaneTitle.TLabel", background="#fff9fc", foreground="#2d2430", font=("Segoe UI", 11, "bold"))
        style.configure("Hint.TLabel", background="#fff9fc", foreground="#8a7583", font=("Segoe UI", 9))
        style.configure("Path.TLabel", background="#fff9fc", foreground="#7a6875", font=("Segoe UI", 9))
        style.configure("Status.TLabel", background="#f6eef3", foreground="#4c3d47", font=("Segoe UI", 10, "bold"))
        style.configure("Accent.TButton", padding=(12, 7))

        self.code_font = tkfont.nametofont("TkFixedFont").copy()
        self.code_font.configure(size=11)

    def _build_ui(self) -> None:
        self.grid_columnconfigure(0, weight=1)
        self.grid_rowconfigure(2, weight=1)

        header = ttk.Frame(self, style="Shell.TFrame", padding=(18, 16, 18, 4))
        header.grid(row=0, column=0, sticky="ew")
        header.grid_columnconfigure(0, weight=1)

        ttk.Label(header, text=APP_TITLE, style="Title.TLabel").grid(row=0, column=0, sticky="w")
        ttk.Label(
            header,
            text="One-screen text comparison with inline pink highlights and Windows file drag and drop.",
            style="SubTitle.TLabel",
        ).grid(row=1, column=0, sticky="w", pady=(4, 0))

        toolbar = ttk.Frame(self, style="Shell.TFrame", padding=(18, 0, 18, 12))
        toolbar.grid(row=1, column=0, sticky="ew")
        toolbar.grid_columnconfigure(5, weight=1)

        ttk.Button(toolbar, text="Compare Now", style="Accent.TButton", command=self.compare_now).grid(row=0, column=0, padx=(0, 8))
        ttk.Button(toolbar, text="Swap", command=self.swap_inputs).grid(row=0, column=1, padx=(0, 8))
        ttk.Button(toolbar, text="Load Sample", command=self.load_sample).grid(row=0, column=2, padx=(0, 8))
        ttk.Button(toolbar, text="Clear All", command=self.clear_all).grid(row=0, column=3, padx=(0, 12))
        ttk.Checkbutton(toolbar, text="Auto compare", variable=self.auto_compare).grid(row=0, column=4, padx=(0, 12))
        ttk.Label(toolbar, textvariable=self.status_var, style="Status.TLabel").grid(row=0, column=5, sticky="e")

        compare_frame = ttk.LabelFrame(self, text="Compare View", style="Card.TLabelframe", padding=(12, 12, 12, 12))
        compare_frame.grid(row=2, column=0, sticky="nsew", padx=18, pady=(0, 18))
        compare_frame.grid_columnconfigure(0, weight=1)
        compare_frame.grid_rowconfigure(0, weight=1)

        compare_shell = ttk.Frame(compare_frame, style="Card.TFrame")
        compare_shell.grid(row=0, column=0, sticky="nsew")
        compare_shell.grid_columnconfigure(0, weight=1)
        compare_shell.grid_rowconfigure(0, weight=1)

        pane_window = ttk.Panedwindow(compare_shell, orient="horizontal")
        pane_window.grid(row=0, column=0, sticky="nsew")

        left_parent = ttk.Frame(pane_window, style="Card.TFrame", padding=(0, 0, 8, 0))
        right_parent = ttk.Frame(pane_window, style="Card.TFrame", padding=(8, 0, 0, 0))
        pane_window.add(left_parent, weight=1)
        pane_window.add(right_parent, weight=1)

        self.left_pane = self._create_editor_pane(left_parent, "Left", "left")
        self.right_pane = self._create_editor_pane(right_parent, "Right", "right")
        self.panes = {"left": self.left_pane, "right": self.right_pane}

        self.vertical_scrollbar = ttk.Scrollbar(compare_shell, orient="vertical", command=self.scroll_vertical)
        self.vertical_scrollbar.grid(row=0, column=1, sticky="ns", padx=(10, 0))

        for side, pane in self.panes.items():
            pane.text.configure(yscrollcommand=lambda first, last, current_side=side: self._sync_vertical(current_side, first, last))

    def _create_editor_pane(self, parent: ttk.Frame, title: str, side: str) -> EditorPane:
        parent.grid_columnconfigure(0, weight=1)
        parent.grid_rowconfigure(2, weight=1)

        path_var = tk.StringVar(value="Drop a file here or click Open")

        top = ttk.Frame(parent, style="Card.TFrame")
        top.grid(row=0, column=0, sticky="ew")
        top.grid_columnconfigure(0, weight=1)

        ttk.Label(top, text=title, style="PaneTitle.TLabel").grid(row=0, column=0, sticky="w")
        ttk.Label(top, text="Drop .txt files directly onto this pane", style="Hint.TLabel").grid(row=1, column=0, sticky="w", pady=(2, 0))

        tools = ttk.Frame(parent, style="Card.TFrame")
        tools.grid(row=1, column=0, sticky="ew", pady=(8, 8))
        tools.grid_columnconfigure(3, weight=1)

        ttk.Button(tools, text="Open", command=lambda current_side=side: self.open_file(current_side)).grid(row=0, column=0, padx=(0, 8))
        ttk.Button(tools, text="Clear", command=lambda current_side=side: self.clear_side(current_side)).grid(row=0, column=1, padx=(0, 8))
        ttk.Label(tools, textvariable=path_var, style="Path.TLabel").grid(row=0, column=3, sticky="e")

        text_shell = ttk.Frame(parent, style="Card.TFrame")
        text_shell.grid(row=2, column=0, sticky="nsew")
        text_shell.grid_columnconfigure(1, weight=1)
        text_shell.grid_rowconfigure(0, weight=1)

        gutter = tk.Text(
            text_shell,
            width=5,
            wrap="none",
            state="disabled",
            takefocus=0,
            borderwidth=1,
            relief="solid",
            padx=8,
            pady=12,
            background="#f7eef3",
            foreground="#7b6674",
            font=self.code_font,
        )
        gutter.grid(row=0, column=0, sticky="ns")

        text_widget = tk.Text(
            text_shell,
            wrap="none",
            undo=True,
            borderwidth=1,
            relief="solid",
            padx=12,
            pady=12,
            background="#fffdfd",
            foreground="#231d25",
            insertbackground="#231d25",
            selectbackground="#f3bfd2",
            tabs=("2c",),
            font=self.code_font,
        )
        text_widget.grid(row=0, column=1, sticky="nsew")

        x_scroll = ttk.Scrollbar(text_shell, orient="horizontal", command=text_widget.xview)
        x_scroll.grid(row=1, column=1, sticky="ew")
        text_widget.configure(xscrollcommand=x_scroll.set)

        text_widget.tag_configure("line_diff", background="#fde7f0")
        text_widget.tag_configure("segment_diff", background="#f7bfd7", foreground="#23141c")
        text_widget.tag_raise("segment_diff")
        gutter.tag_configure("line_diff", foreground="#b83d75", background="#f6ebf1")

        text_widget.bind("<<Modified>>", self.on_editor_modified)
        text_widget.bind("<MouseWheel>", self.on_mousewheel)
        text_widget.bind("<Button-4>", self.on_mousewheel_linux)
        text_widget.bind("<Button-5>", self.on_mousewheel_linux)
        gutter.bind("<MouseWheel>", self.on_mousewheel)
        gutter.bind("<Button-4>", self.on_mousewheel_linux)
        gutter.bind("<Button-5>", self.on_mousewheel_linux)

        return EditorPane(side=side, frame=parent, gutter=gutter, text=text_widget, path_var=path_var)

    def _bind_shortcuts(self) -> None:
        self.bind("<F5>", lambda _event: self.compare_now())
        self.bind("<Control-Return>", lambda _event: self.compare_now())

    def _finish_startup(self) -> None:
        try:
            self.drop_enabled = self.drop_support.install()
        except Exception:
            self.drop_enabled = False

        self.compare_now()

        if self.drop_enabled:
            self.status_var.set("Ready. Paste text, open files, or drag .txt files onto the left and right panes.")
        else:
            self.status_var.set("Ready. Paste text or open files. Drag and drop could not be enabled in this session.")

    def on_close(self) -> None:
        self.drop_support.uninstall()
        self.destroy()

    def on_editor_modified(self, event: tk.Event) -> None:
        widget = event.widget
        if not isinstance(widget, tk.Text):
            return

        widget.edit_modified(False)
        if self.auto_compare.get():
            self.schedule_compare()

    def schedule_compare(self) -> None:
        if self.pending_compare_id is not None:
            self.after_cancel(self.pending_compare_id)
        self.pending_compare_id = self.after(AUTO_COMPARE_DELAY_MS, self.compare_now)

    def compare_now(self) -> None:
        if self.pending_compare_id is not None:
            self.after_cancel(self.pending_compare_id)
            self.pending_compare_id = None

        left_text = self.left_pane.text.get("1.0", "end-1c")
        right_text = self.right_pane.text.get("1.0", "end-1c")
        rows = build_diff_rows(left_text, right_text)

        self.clear_diff_tags()
        self.apply_diff_rows(rows)
        self.update_gutters()
        self.update_status(rows, left_text, right_text)

    def clear_diff_tags(self) -> None:
        for pane in self.panes.values():
            pane.text.tag_remove("line_diff", "1.0", "end")
            pane.text.tag_remove("segment_diff", "1.0", "end")
            pane.gutter.configure(state="normal")
            pane.gutter.tag_remove("line_diff", "1.0", "end")

    def apply_diff_rows(self, rows: list[DiffRow]) -> None:
        changed_lines = {"left": set(), "right": set()}

        for row in rows:
            if row.changed and row.left_line_no is not None:
                changed_lines["left"].add(row.left_line_no)
                self.highlight_line(self.left_pane.text, row.left_line_no)
                self.highlight_segments(self.left_pane.text, row.left_line_no, row.left_segments)

            if row.changed and row.right_line_no is not None:
                changed_lines["right"].add(row.right_line_no)
                self.highlight_line(self.right_pane.text, row.right_line_no)
                self.highlight_segments(self.right_pane.text, row.right_line_no, row.right_segments)

        for side, pane in self.panes.items():
            self.fill_gutter(pane, changed_lines[side])

    def highlight_line(self, widget: tk.Text, line_no: int) -> None:
        start = f"{line_no}.0"
        end = widget.index(f"{line_no}.0 lineend +1c")
        widget.tag_add("line_diff", start, end)

    def highlight_segments(self, widget: tk.Text, line_no: int, segments: list[tuple[str, bool]]) -> None:
        offset = 0
        for text, is_diff in segments:
            length = len(text)
            if is_diff and length:
                start = f"{line_no}.0 + {offset}c"
                end = f"{line_no}.0 + {offset + length}c"
                widget.tag_add("segment_diff", start, end)
            offset += length

    def fill_gutter(self, pane: EditorPane, changed_lines: set[int]) -> None:
        content = pane.text.get("1.0", "end-1c")
        line_count = line_count_for_text(content)
        current_fraction = pane.text.yview()[0]

        pane.gutter.delete("1.0", "end")
        for line_no in range(1, line_count + 1):
            start = pane.gutter.index("end-1c")
            pane.gutter.insert("end", f"{line_no:>4}\n")
            if line_no in changed_lines:
                pane.gutter.tag_add("line_diff", start, f"{start} lineend +1c")

        pane.gutter.configure(state="disabled")
        pane.gutter.yview_moveto(current_fraction)

    def update_gutters(self) -> None:
        for pane in self.panes.values():
            pane.gutter.yview_moveto(pane.text.yview()[0])

    def update_status(self, rows: list[DiffRow], left_text: str, right_text: str) -> None:
        left_lines = len(split_lines(left_text))
        right_lines = len(split_lines(right_text))
        changed_rows = sum(1 for row in rows if row.changed)
        left_only_rows = sum(1 for row in rows if row.left_line_no is not None and row.right_line_no is None)
        right_only_rows = sum(1 for row in rows if row.left_line_no is None and row.right_line_no is not None)

        if not left_text and not right_text:
            suffix = " Drag and drop is ready." if self.drop_enabled else ""
            self.status_var.set("Paste text or open files to start comparing." + suffix)
            return

        if changed_rows == 0 and left_text == right_text:
            self.status_var.set(f"No differences. Left {left_lines} lines / Right {right_lines} lines.")
            return

        self.status_var.set(
            f"Changed lines: {changed_rows} | Left: {left_lines} | Right: {right_lines} | Left-only: {left_only_rows} | Right-only: {right_only_rows}"
        )

    def open_file(self, side: str) -> None:
        path = filedialog.askopenfilename(
            title="Open text file",
            filetypes=[("Text files", "*.txt"), ("Log files", "*.log"), ("All files", "*.*")],
        )
        if not path:
            return

        self.load_path_into_side(side, Path(path))

    def load_path_into_side(self, side: str, path: Path, compare_after: bool = True) -> bool:
        try:
            content = read_text_file(path)
        except OSError as exc:
            messagebox.showerror("Open failed", f"Could not read the file.\n\n{exc}")
            return False

        pane = self.panes[side]
        self.set_editor_text(pane.text, content)
        pane.path_var.set(str(path))

        if compare_after:
            self.compare_now()
        return True

    def set_editor_text(self, widget: tk.Text, content: str) -> None:
        widget.delete("1.0", "end")
        widget.insert("1.0", normalize_text(content))
        widget.edit_modified(False)

    def clear_side(self, side: str) -> None:
        pane = self.panes[side]
        self.set_editor_text(pane.text, "")
        pane.path_var.set("Drop a file here or click Open")
        self.compare_now()

    def clear_all(self) -> None:
        for pane in self.panes.values():
            self.set_editor_text(pane.text, "")
            pane.path_var.set("Drop a file here or click Open")
        self.compare_now()

    def swap_inputs(self) -> None:
        left_content = self.left_pane.text.get("1.0", "end-1c")
        right_content = self.right_pane.text.get("1.0", "end-1c")
        left_path = self.left_pane.path_var.get()
        right_path = self.right_pane.path_var.get()

        self.set_editor_text(self.left_pane.text, right_content)
        self.set_editor_text(self.right_pane.text, left_content)
        self.left_pane.path_var.set(right_path)
        self.right_pane.path_var.set(left_path)
        self.compare_now()

    def load_sample(self) -> None:
        self.set_editor_text(self.left_pane.text, LEFT_SAMPLE)
        self.set_editor_text(self.right_pane.text, RIGHT_SAMPLE)
        self.left_pane.path_var.set("Sample text")
        self.right_pane.path_var.set("Sample text")
        self.compare_now()

    def scroll_vertical(self, *args: str) -> None:
        self.syncing_vertical = True
        try:
            for pane in self.panes.values():
                pane.text.yview(*args)
                pane.gutter.yview(*args)
        finally:
            self.syncing_vertical = False

        first, last = self.left_pane.text.yview()
        self.vertical_scrollbar.set(first, last)

    def _sync_vertical(self, side: str, first: str, last: str) -> None:
        self.vertical_scrollbar.set(first, last)
        if self.syncing_vertical:
            return

        self.syncing_vertical = True
        try:
            fraction = float(first)
            for current_side, pane in self.panes.items():
                if current_side != side:
                    pane.text.yview_moveto(fraction)
                pane.gutter.yview_moveto(fraction)
        finally:
            self.syncing_vertical = False

    def on_mousewheel(self, event: tk.Event) -> str:
        units = -int(event.delta / 120) if event.delta else 0
        if units:
            self.scroll_vertical("scroll", units, "units")
        return "break"

    def on_mousewheel_linux(self, event: tk.Event) -> str:
        units = -1 if event.num == 4 else 1
        self.scroll_vertical("scroll", units, "units")
        return "break"

    def handle_file_drop(self, paths: list[Path], screen_x: int, screen_y: int) -> None:
        files = [path for path in paths if path.is_file()]
        if not files:
            self.status_var.set("Ignored drop because it did not contain any files.")
            return

        widget = self.winfo_containing(screen_x, screen_y)
        primary_side = self.identify_drop_side(widget, screen_x)

        if len(files) >= 2:
            sides = [primary_side, "right" if primary_side == "left" else "left"]
            loaded = 0
            for side, path in zip(sides, files[:2]):
                if self.load_path_into_side(side, path, compare_after=False):
                    loaded += 1

            self.compare_now()

            ignored_count = len(files) - 2
            message = f"Loaded {loaded} dropped files into both panes."
            if ignored_count > 0:
                message += f" Ignored {ignored_count} extra file(s)."
            self.status_var.set(message)
            return

        target_side = primary_side
        if self.load_path_into_side(target_side, files[0], compare_after=True):
            self.status_var.set(f"Loaded dropped file into the {target_side} pane.")

    def identify_drop_side(self, widget: tk.Misc | None, screen_x: int) -> str:
        if widget is not None:
            if self.is_descendant_of(widget, self.left_pane.frame):
                return "left"
            if self.is_descendant_of(widget, self.right_pane.frame):
                return "right"

        midpoint = self.winfo_rootx() + (self.winfo_width() // 2)
        return "left" if screen_x < midpoint else "right"

    def is_descendant_of(self, widget: tk.Misc, ancestor: tk.Misc) -> bool:
        current: tk.Misc | None = widget
        while current is not None:
            if current == ancestor:
                return True
            current = current.master
        return False


def main() -> None:
    app = TextCompareApp()
    app.mainloop()


if __name__ == "__main__":
    main()
