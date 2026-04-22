'use strict';

import * as vscode from 'vscode';
import { adjustIndent, IndentConfig } from './indent';


let pasteIndent = () => {
    let editor = vscode.window.activeTextEditor;
    if (editor === undefined)
        return;

    let baseIndent = editor.selection.start.character,
        insertSpaces = Boolean(editor.options.insertSpaces),
        tabSize = Number(editor.options.tabSize);

    vscode.env.clipboard.readText().then((s) => {
        let sep = '\n';
        if (s.indexOf('\r\n') != -1)
            sep = '\r\n';

        let lines = s.split(sep);
        const config: IndentConfig = { baseIndent, insertSpaces, tabSize };

        const adjusted = adjustIndent(lines, config);
        if (adjusted === null) {
            vscode.commands.executeCommand('editor.action.clipboardPasteAction');
            return;
        }

        vscode.env.clipboard.writeText(adjusted.join('\n')).then(() => {
            vscode.commands.executeCommand('editor.action.clipboardPasteAction');
        });
    });
}

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.commands.registerCommand('pyPasteIndent.pasteIndent', pasteIndent));
}

export function deactivate() {
}
