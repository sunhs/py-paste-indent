'use strict';

import * as vscode from 'vscode';


let pasteAndIndent = () => {

    let editor = vscode.window.activeTextEditor;
    let anchor = editor.selection.anchor;

    vscode.commands.executeCommand('editor.action.clipboardPasteAction').then(() => {
        /*
         * baseOffset: Number of preceding spaces of the first line.
         * offsetToFirstLine: If the first line ends with ':', the rest lines should first indent by this margin.
         * indents: Number of preceding spaces of the lines, from the second line. -1 for empty lines.
         * offsets: Number of preceding spaces of the lines with respect to the second line. -1 for empty lines.
         * When indenting the pasted text, the first line stays unchanged, with its indentation decided by
         * other mechanism such as autoindent for python, and is equal to baseOffset.
         * From the second line on, each line follows n spaces,
         * where n = baseOffset + offsetToFirstLine + offsets[i].
         */
        let cursor = editor.selection.anchor;
        let selection = new vscode.Selection(anchor, cursor);
        let offsetToFirstLine = 0;
        let pastedText = editor.document.getText(selection).split('\n');

        if (pastedText[0].endsWith(':')) {
            offsetToFirstLine = Number(vscode.workspace.getConfiguration('editor').get('tabSize'));
        }

        let baseOffset = anchor.character;
        let indents = [];
        let offsets = [];

        pastedText.shift();

        pastedText.forEach(line => {
            indents.push(line.search(/\S/));
        });

        indents.forEach(e => {
            if (e !== -1) {
                offsets.push(e - indents[0]);
            } else {
                offsets.push(-1);
            }
        });

        pastedText.forEach((line, index) => {
            let alphaIndex = indents[index];
            let expression;
            if (alphaIndex !== -1) {
                pastedText[index] = ' '.repeat(baseOffset + offsetToFirstLine + offsets[index]) + line.substr(alphaIndex);
            }
        });

        let modSelection = new vscode.Selection(anchor.line + 1, 0, cursor.line, cursor.character);
        editor.edit((editBuilder: vscode.TextEditorEdit) => {
            editBuilder.replace(modSelection, pastedText.join('\n'));
        });
    })
}

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.commands.registerCommand('pyPasteIndent.pasteAndIndent', pasteAndIndent));
}

export function deactivate() {
}