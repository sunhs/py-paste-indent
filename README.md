# PY-PASTE-INDENT

## Features
 - Automatically indent python code block when pasting.


## Requirements
This feature utilizes other auto indent mechanism to indent the first line. For example, the `Python` extension by Don Jayamanne.


## Extension Settings
Bind your preferred keyboard shortcut to the command:

    pyPasteIndent.pasteIndent
    
Example keybinding code, using <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>v</kbd> to execute `pyPasteIndent.pasteIndent` when editing Python Code:

```json
{
  "key": "ctrl+shift+v",
  "command": "pyPasteIndent.pasteIndent",
  "when": "editorLangId == 'python'"
}
```
