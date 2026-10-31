import { describe, it, expect } from 'vitest';
import { defaultToolbar, icons } from './toolbar';

describe('toolbar', () => {
  describe('icons', () => {
    it('should have an icon for every toolbar button that needs one', () => {
      const buttonItems = defaultToolbar.filter((item) => item.type === 'button' && item.icon);
      const iconKeys = Object.keys(icons);
      for (const item of buttonItems) {
        if (item.icon) {
          expect(iconKeys, `icon "${item.icon}" referenced by "${item.name}"`).toContain(item.icon);
        }
      }
    });

    it('should have 22+ built-in icons', () => {
      expect(Object.keys(icons).length).toBeGreaterThanOrEqual(22);
    });

    it('should have icons for comment and export buttons', () => {
      expect(icons).toHaveProperty('comment');
      expect(icons).toHaveProperty('exportPDF');
      expect(icons).toHaveProperty('exportWord');
    });

    it('should only contain non-empty SVG strings', () => {
      for (const svg of Object.values(icons)) {
        expect(typeof svg).toBe('string');
        expect(svg).toContain('<svg');
        expect(svg).toMatch(/^<svg[^>]*>/);
        // No unescaped quotes inside attribute values
        expect(() => new DOMParser().parseFromString(svg, 'image/svg+xml')).not.toThrow();
      }
    });

    it('should have textColor and bgColor icons', () => {
      expect(icons).toHaveProperty('textColor');
      expect(icons).toHaveProperty('bgColor');
    });
  });

  describe('defaultToolbar', () => {
    it('should have more than 20 items', () => {
      expect(defaultToolbar.length).toBeGreaterThan(20);
    });

    it('should have valid type field for all items', () => {
      for (const item of defaultToolbar) {
        expect(['button', 'separator', 'dropdown']).toContain(item.type);
      }
    });

    it('should only contain buttons or separators', () => {
      for (const item of defaultToolbar) {
        expect(item.type).not.toBe('dropdown');
      }
    });

    it('should have separator items with no command', () => {
      for (const item of defaultToolbar) {
        if (item.type === 'separator') {
          expect(item.command).toBeUndefined();
        }
      }
    });

    it('should have buttons with commands', () => {
      const buttons = defaultToolbar.filter((item) => item.type === 'button');
      expect(buttons.length).toBeGreaterThan(15);
      for (const btn of buttons) {
        expect(typeof btn.command).toBe('string');
        expect(btn.command!.length).toBeGreaterThan(0);
      }
    });

    it('should have tooltips for all buttons', () => {
      const buttons = defaultToolbar.filter((item) => item.type === 'button');
      for (const btn of buttons) {
        expect(typeof btn.tooltip).toBe('string');
        expect(btn.tooltip!.length).toBeGreaterThan(0);
      }
    });

    it('should group related formatting commands with separators', () => {
      const indices = defaultToolbar
        .map((item, idx) => (item.type === 'separator' ? idx : -1))
        .filter((idx) => idx !== -1);
      expect(indices.length).toBeGreaterThan(5);
    });

    it('should include heading commands with the correct values', () => {
      const h1 = defaultToolbar.find(
        (item) => item.type === 'button' && item.command === 'formatBlock' && item.value === 'H1',
      );
      expect(h1).toBeDefined();
      const h2 = defaultToolbar.find(
        (item) => item.type === 'button' && item.command === 'formatBlock' && item.value === 'H2',
      );
      expect(h2).toBeDefined();
      const h3 = defaultToolbar.find(
        (item) => item.type === 'button' && item.command === 'formatBlock' && item.value === 'H3',
      );
      expect(h3).toBeDefined();
    });

    it('should have undo and redo at the start', () => {
      const first = defaultToolbar[0];
      const second = defaultToolbar[1];
      expect(first.command).toBe('undo');
      expect(second.command).toBe('redo');
    });

    it('should end with color buttons after cleanup tools', () => {
      const last = defaultToolbar[defaultToolbar.length - 1];
      expect(last.command).toBe('hiliteColor');
      // removeFormat comes right before the color buttons
      const cmds = defaultToolbar
        .filter((i) => i.type === 'button')
        .map((i) => i.command);
      expect(cmds.slice(-3)).toEqual(['removeFormat', 'foreColor', 'hiliteColor']);
    });

    it('should include code formatting (PRE block) and color buttons', () => {
      const codeBtn = defaultToolbar.find(
        (item) => item.type === 'button' && item.value === 'PRE',
      );
      expect(codeBtn).toBeDefined();
      const colorBtn = defaultToolbar.find(
        (item) => item.type === 'button' && item.command === 'foreColor',
      );
      expect(colorBtn).toBeDefined();
      const bgBtn = defaultToolbar.find(
        (item) => item.type === 'button' && item.command === 'hiliteColor',
      );
      expect(bgBtn).toBeDefined();
    });
  });
});
