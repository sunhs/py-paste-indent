'use strict';

export interface IndentConfig {
    baseIndent: number;
    insertSpaces: boolean;
    tabSize: number;
}

export function adjustIndent(lines: string[], config: IndentConfig): string[] | null {
    const EndChar = [':', '(', '[', '{'];

    const nonEmptyCnt: number = countNonEmpty(lines);
    if (nonEmptyCnt <= 1) {
        return null;
    }

    const { firstIdx, firstIndent, secondIdx, secondIndent } = findFirstTwoNonEmpty(lines);

    const blank = config.insertSpaces ? ' ' : '\t';

    let blockIndent = 0;
    for (const endChar of EndChar) {
        if (lines[firstIdx].replace(/\s+$/, '').endsWith(endChar)) {
            blockIndent = config.insertSpaces ? config.tabSize : 1;
            break;
        }
    }

    const adjusted = [...lines];

    if (firstIndent > 0) {
        adjusted[firstIdx] = adjusted[firstIdx].substring(firstIndent);
    }
    if (firstIdx > 0) {
        adjusted[firstIdx] = blank.repeat(config.baseIndent) + adjusted[firstIdx];
    }

    const diff = config.baseIndent + blockIndent - secondIndent;
    if (diff !== 0) {
        for (let i = secondIdx; i < adjusted.length; ++i) {
            if (adjusted[i].trim() === '')
                continue;
            if (diff < 0)
                adjusted[i] = adjusted[i].substring(-diff);
            else if (diff > 0)
                adjusted[i] = blank.repeat(diff) + adjusted[i];
        }
    }

    return adjusted;
}

function countNonEmpty(lines: string[]): number {
    let cnt = 0;
    for (const line of lines) {
        if (line.trim() !== '')
            ++cnt;
    }
    return cnt;
}

function findFirstTwoNonEmpty(lines: string[]): {
    firstIdx: number;
    firstIndent: number;
    secondIdx: number;
    secondIndent: number;
} {
    let firstIdx = -1, firstIndent = -1;
    let secondIdx = -1, secondIndent = -1;
    for (let i = 0; i < lines.length; ++i) {
        if (lines[i].trim() !== '') {
            if (firstIdx === -1) {
                firstIdx = i;
                firstIndent = lines[i].search(/\S/);
            } else if (secondIdx === -1) {
                secondIdx = i;
                secondIndent = lines[i].search(/\S/);
                break;
            }
        }
    }
    return { firstIdx, firstIndent, secondIdx, secondIndent };
}
