'use strict';

import * as vscode from 'vscode';


let pasteIndent = () => {
    const EndChar = [':', '(', '[', '{'];

    let editor = vscode.window.activeTextEditor;
    if (editor === undefined)
        return;

    let baseIndent = editor.selection.start.character,
        insertSpaces = Boolean(editor.options.insertSpaces),
        tabSize = Number(editor.options.tabSize),
        blank = ' ';
    if (!insertSpaces)
        blank = '\t';

    vscode.env.clipboard.readText().then((s) => {
        let sep = '\n';
        if (s.indexOf('\r\n') != -1)
            sep = '\r\n';

        let lines = s.split(sep),
            nonEmptyCnt = 0,
            firstLineNotEmpty = -1,
            indentForFirstLineNotEmpty = -1;
        for (var i = 0; i < lines.length; ++i) {
            if (lines[i].trim() != '') {
                ++nonEmptyCnt;
                if (i != 0 && firstLineNotEmpty == -1 && indentForFirstLineNotEmpty == -1) {
                    firstLineNotEmpty = i;
                    indentForFirstLineNotEmpty = lines[i].search(/\S/);
                }
            }
            if (nonEmptyCnt > 1)
                break;
        }
        if (nonEmptyCnt <= 1) {
            vscode.commands.executeCommand('editor.action.clipboardPasteAction');
            return;
        }

        let blockIndent = 0;
        for (var endChar of EndChar) {
            if (lines[0].endsWith(endChar)) {
                if (insertSpaces)
                    blockIndent = tabSize;
                else
                    blockIndent = 1;
                break;
            }
        }

        let diff = baseIndent + blockIndent - indentForFirstLineNotEmpty;
        if (diff != 0) {
            for (let i = firstLineNotEmpty; i < lines.length; ++i) {
                if (diff < 0)
                    lines[i] = lines[i].substr(-diff);
                else if (diff > 0)
                    lines[i] = blank.repeat(diff) + lines[i];
            }
        }

        vscode.env.clipboard.writeText(lines.join('\n')).then(() => {
            vscode.commands.executeCommand('editor.action.clipboardPasteAction');
        });
    });
}

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.commands.registerCommand('pyPasteIndent.pasteIndent', pasteIndent));
}

export function deactivate() {
}