import { describe, it, expect } from 'vitest';
import { adjustIndent, IndentConfig } from './indent';

const S4: IndentConfig = { baseIndent: 0, insertSpaces: true, tabSize: 4 };
const S4_COL4: IndentConfig = { baseIndent: 4, insertSpaces: true, tabSize: 4 };
const S4_COL8: IndentConfig = { baseIndent: 8, insertSpaces: true, tabSize: 4 };
const TAB_COL2: IndentConfig = { baseIndent: 2, insertSpaces: false, tabSize: 4 };

describe('adjustIndent', () => {
    // adjustIndent 是纯函数，只负责行内缩进调整。
    // line 0 在 VS Code 中会被放在光标列位置（由编辑器提供 baseIndent），
    // 所以 firstIdx==0 时函数不会给 line 0 补 baseIndent。
    // firstIdx>0 时函数会补 baseIndent，因为该行在粘贴后从列 0 开始。

    it('T1: 首行有缩进，粘贴到列 0', () => {
        const lines = ['    def foo():', '        pass'];
        // firstIdx=0, 清除首行4空格; diff=0+4-8=-4, 第二行截4空格
        expect(adjustIndent(lines, S4)).toEqual(['def foo():', '    pass']);
    });

    it('T1: 首行有缩进，粘贴到列 4', () => {
        const lines = ['    def foo():', '        pass'];
        // firstIdx=0, 清除首行4空格; diff=4+4-8=0, 第二行不变
        // line 0 由 VS Code 放在列4，最终显示为 "    def foo():"
        expect(adjustIndent(lines, S4_COL4)).toEqual(['def foo():', '        pass']);
    });

    it('T2: 首行无缩进，粘贴到非零列', () => {
        const lines = ['def foo():', '    pass'];
        // firstIdx=0, 无需清除; diff=4+4-4=4, 第二行补4空格
        expect(adjustIndent(lines, S4_COL4)).toEqual(['def foo():', '        pass']);
    });

    it('T3: 首行有缩进，粘贴到列 0', () => {
        const lines = ['    def foo():', '        pass'];
        // firstIdx=0, 清除首行4空格; diff=0+4-8=-4, 第二行截4空格
        expect(adjustIndent(lines, S4)).toEqual(['def foo():', '    pass']);
    });

    it('T4: 首行无缩进，粘贴到列 0', () => {
        const lines = ['def foo():', '    pass'];
        // firstIdx=0, 无需清除; diff=0+4-4=0, 无变化
        expect(adjustIndent(lines, S4)).toEqual(['def foo():', '    pass']);
    });

    it('T5: 前导空行，首行有缩进', () => {
        const lines = ['', '', '    def foo():', '        pass'];
        // firstIdx=2>0, 清除首行4空格后补baseIndent=4; diff=4+4-8=0
        expect(adjustIndent(lines, S4_COL4)).toEqual(['', '', '    def foo():', '        pass']);
    });

    it('T6: 前导空行，首行无缩进', () => {
        const lines = ['', '', 'def foo():', '    pass'];
        // firstIdx=2>0, 无需清除但补baseIndent=4; diff=4+4-4=4
        expect(adjustIndent(lines, S4_COL4)).toEqual(['', '', '    def foo():', '        pass']);
    });

    it('T7: EndChar 冒号触发块缩进', () => {
        const lines = ['for a in b:', '    pass'];
        // firstIdx=0, blockIndent=4; diff=4+4-4=4
        expect(adjustIndent(lines, S4_COL4)).toEqual(['for a in b:', '        pass']);
    });

    it('T8: EndChar 括号触发块缩进', () => {
        const lines = ['def foo(', '    a,', '    b', '):'];
        // firstIdx=0, blockIndent=4; diff=4+4-4=4
        expect(adjustIndent(lines, S4_COL4)).toEqual([
            'def foo(',
            '        a,',
            '        b',
            '    ):',
        ]);
    });

    it('T9: EndChar 方括号触发块缩进', () => {
        const lines = ['x = [', '    1,', '    2', ']'];
        // firstIdx=0, blockIndent=4; diff=4+4-4=4
        expect(adjustIndent(lines, S4_COL4)).toEqual([
            'x = [',
            '        1,',
            '        2',
            '    ]',
        ]);
    });

    it('T9: EndChar 花括号触发块缩进', () => {
        const lines = ['x = {', '    "a": 1,', '    "b": 2', '}'];
        // firstIdx=0, blockIndent=4; diff=4+4-4=4
        expect(adjustIndent(lines, S4_COL4)).toEqual([
            'x = {',
            '        "a": 1,',
            '        "b": 2',
            '    }',
        ]);
    });

    it('T10: 无 EndChar，纯平级代码', () => {
        const lines = ['a = 1', 'b = 2', 'c = 3'];
        // firstIdx=0, blockIndent=0; diff=4+0-0=4
        expect(adjustIndent(lines, S4_COL4)).toEqual(['a = 1', '    b = 2', '    c = 3']);
    });

    it('T11: 中间空行保持空白', () => {
        const lines = ['for a in b:', '', '    pass'];
        // firstIdx=0, blockIndent=4; diff=4+4-4=4; 中间空行跳过
        expect(adjustIndent(lines, S4_COL4)).toEqual(['for a in b:', '', '        pass']);
    });

    it('T12: 单行粘贴回退原生粘贴', () => {
        expect(adjustIndent(['a = 1'], S4_COL4)).toBeNull();
    });

    it('T13: 3 层嵌套缩进', () => {
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

    it('T14: 行尾空白 + EndChar', () => {
        const lines = ['for a in b:    ', '    pass'];
        // replace(/\s+$/, '') 后 "for a in b:" 仍以 : 结尾; diff=4+4-4=4
        expect(adjustIndent(lines, S4_COL4)).toEqual(['for a in b:    ', '        pass']);
    });

    it('T15: 缩进减少', () => {
        const lines = ['        def foo():', '            pass'];
        // firstIdx=0, 清除首行8空格; diff=0+4-12=-8, 第二行截8空格
        expect(adjustIndent(lines, S4)).toEqual(['def foo():', '    pass']);
    });

    it('T16: 全空剪贴板回退原生粘贴', () => {
        expect(adjustIndent(['', '', ''], S4_COL4)).toBeNull();
    });

    it('T17: 前导空行 + 首行无缩进 + EndChar', () => {
        const lines = ['', 'for a in b:', '    pass'];
        // firstIdx=1>0, 补baseIndent=4; blockIndent=4; diff=4+4-4=4
        expect(adjustIndent(lines, S4_COL4)).toEqual(['', '    for a in b:', '        pass']);
    });

    it('T18: Tab 缩进模式', () => {
        const lines = ['\tdef foo():', '\t\tpass'];
        // firstIdx=0, 清除首行1个tab; blockIndent=1; diff=2+1-2=1, 第二行补1个tab
        expect(adjustIndent(lines, TAB_COL2)).toEqual(['def foo():', '\t\t\tpass']);
    });
});
