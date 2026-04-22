import { describe, it, expect } from 'vitest';
import { adjustIndent, IndentConfig } from './indent';

const S4: IndentConfig = { baseIndent: 0, insertSpaces: true, tabSize: 4 };
const S4_COL4: IndentConfig = { baseIndent: 4, insertSpaces: true, tabSize: 4 };
const S4_COL8: IndentConfig = { baseIndent: 8, insertSpaces: true, tabSize: 4 };
const TAB_COL2: IndentConfig = { baseIndent: 2, insertSpaces: false, tabSize: 4 };

describe('adjustIndent', () => {
    // adjustIndent is a pure function that only normalizes pasted line content.
    // In VS Code, line 0 is pasted at the cursor column by the editor itself.
    // So when firstIdx == 0, the function does not prepend baseIndent to line 0.
    // When firstIdx > 0, it must prepend baseIndent because that line starts at column 0.

    it('T1: first line indented, pasted at column 0', () => {
        const lines = ['    def foo():', '        pass'];
        // firstIdx=0, strip 4 spaces from line 0; diff=0+4-8=-4, remove 4 spaces from line 1
        expect(adjustIndent(lines, S4)).toEqual(['def foo():', '    pass']);
    });

    it('T1: first line indented, pasted at column 4', () => {
        const lines = ['    def foo():', '        pass'];
        // firstIdx=0, strip 4 spaces from line 0; diff=4+4-8=0, line 1 stays unchanged
        // VS Code places line 0 at column 4, so it is displayed as "    def foo():"
        expect(adjustIndent(lines, S4_COL4)).toEqual(['def foo():', '        pass']);
    });

    it('T2: first line not indented, pasted at non-zero column', () => {
        const lines = ['def foo():', '    pass'];
        // firstIdx=0, nothing to strip; diff=4+4-4=4, add 4 spaces to line 1
        expect(adjustIndent(lines, S4_COL4)).toEqual(['def foo():', '        pass']);
    });

    it('T3: first line indented, pasted at column 0', () => {
        const lines = ['    def foo():', '        pass'];
        // firstIdx=0, strip 4 spaces from line 0; diff=0+4-8=-4, remove 4 spaces from line 1
        expect(adjustIndent(lines, S4)).toEqual(['def foo():', '    pass']);
    });

    it('T4: first line not indented, pasted at column 0', () => {
        const lines = ['def foo():', '    pass'];
        // firstIdx=0, nothing to strip; diff=0+4-4=0, no change
        expect(adjustIndent(lines, S4)).toEqual(['def foo():', '    pass']);
    });

    it('T5: leading blank lines, first non-empty line indented', () => {
        const lines = ['', '', '    def foo():', '        pass'];
        // firstIdx=2>0, strip 4 spaces then prepend baseIndent=4; diff=4+4-8=0
        expect(adjustIndent(lines, S4_COL4)).toEqual(['', '', '    def foo():', '        pass']);
    });

    it('T6: leading blank lines, first non-empty line not indented', () => {
        const lines = ['', '', 'def foo():', '    pass'];
        // firstIdx=2>0, nothing to strip but prepend baseIndent=4; diff=4+4-4=4
        expect(adjustIndent(lines, S4_COL4)).toEqual(['', '', '    def foo():', '        pass']);
    });

    it('T7: colon end char triggers block indent', () => {
        const lines = ['for a in b:', '    pass'];
        // firstIdx=0, blockIndent=4; diff=4+4-4=4
        expect(adjustIndent(lines, S4_COL4)).toEqual(['for a in b:', '        pass']);
    });

    it('T8: open paren end char triggers block indent', () => {
        const lines = ['def foo(', '    a,', '    b', '):'];
        // firstIdx=0, blockIndent=4; diff=4+4-4=4
        expect(adjustIndent(lines, S4_COL4)).toEqual([
            'def foo(',
            '        a,',
            '        b',
            '    ):',
        ]);
    });

    it('T9: open bracket end char triggers block indent', () => {
        const lines = ['x = [', '    1,', '    2', ']'];
        // firstIdx=0, blockIndent=4; diff=4+4-4=4
        expect(adjustIndent(lines, S4_COL4)).toEqual([
            'x = [',
            '        1,',
            '        2',
            '    ]',
        ]);
    });

    it('T9: open brace end char triggers block indent', () => {
        const lines = ['x = {', '    "a": 1,', '    "b": 2', '}'];
        // firstIdx=0, blockIndent=4; diff=4+4-4=4
        expect(adjustIndent(lines, S4_COL4)).toEqual([
            'x = {',
            '        "a": 1,',
            '        "b": 2',
            '    }',
        ]);
    });

    it('T10: flat code without end char trigger', () => {
        const lines = ['a = 1', 'b = 2', 'c = 3'];
        // firstIdx=0, blockIndent=0; diff=4+0-0=4
        expect(adjustIndent(lines, S4_COL4)).toEqual(['a = 1', '    b = 2', '    c = 3']);
    });

    it('T11: middle blank lines stay blank', () => {
        const lines = ['for a in b:', '', '    pass'];
        // firstIdx=0, blockIndent=4; diff=4+4-4=4; skip the blank line
        expect(adjustIndent(lines, S4_COL4)).toEqual(['for a in b:', '', '        pass']);
    });

    it('T12: single-line paste falls back to native paste', () => {
        expect(adjustIndent(['a = 1'], S4_COL4)).toBeNull();
    });

    it('T13: three-level nested indentation', () => {
        const lines = [
            'def foo():',
            '    def bar():',
            '        for a in b:',
            '            pass',
        ];
        // firstIdx=0, blockIndent=4; diff=8+4-4=8
        expect(adjustIndent(lines, S4_COL8)).toEqual([
            'def foo():',
            '            def bar():',
            '                for a in b:',
            '                    pass',
        ]);
    });

    it('T14: trailing whitespace with end char trigger', () => {
        const lines = ['for a in b:    ', '    pass'];
        // after replace(/\s+$/, ''), "for a in b:" still ends with ':'; diff=4+4-4=4
        expect(adjustIndent(lines, S4_COL4)).toEqual(['for a in b:    ', '        pass']);
    });

    it('T15: indentation decreases', () => {
        const lines = ['        def foo():', '            pass'];
        // firstIdx=0, strip 8 spaces from line 0; diff=0+4-12=-8, remove 8 spaces from line 1
        expect(adjustIndent(lines, S4)).toEqual(['def foo():', '    pass']);
    });

    it('T16: all-blank clipboard falls back to native paste', () => {
        expect(adjustIndent(['', '', ''], S4_COL4)).toBeNull();
    });

    it('T17: leading blank lines plus end char trigger', () => {
        const lines = ['', 'for a in b:', '    pass'];
        // firstIdx=1>0, prepend baseIndent=4; blockIndent=4; diff=4+4-4=4
        expect(adjustIndent(lines, S4_COL4)).toEqual(['', '    for a in b:', '        pass']);
    });

    it('T18: tab indentation mode', () => {
        const lines = ['\tdef foo():', '\t\tpass'];
        // firstIdx=0, strip 1 tab from line 0; blockIndent=1; diff=2+1-2=1, add 1 tab to line 1
        expect(adjustIndent(lines, TAB_COL2)).toEqual(['def foo():', '\t\t\tpass']);
    });
});
