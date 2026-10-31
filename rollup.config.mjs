import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import postcss from 'rollup-plugin-postcss';
import dts from 'rollup-plugin-dts';
import { rmSync } from 'node:fs';

const banner = `/*!
 * SRich Editor v1.0.0
 * A lightweight, dependency-free rich text editor
 * MIT License
 */`;

export default [
  // Build CSS
  // The postcss plugin extracts the CSS as an asset; the JS chunk itself is
  // written to a temp file and removed afterwards, so the extracted asset is
  // not overwritten (fixes the "overwrites a previously emitted file" warning).
  {
    input: 'src/styles.css',
    output: {
      file: 'dist/.css-build-tmp.js',
      format: 'es',
    },
    plugins: [
      postcss({
        extract: 'styles.css',
        minimize: true,
      }),
      {
        name: 'cleanup-css-tmp-chunk',
        writeBundle() {
          rmSync('dist/.css-build-tmp.js', { force: true });
        },
      },
    ],
  },
  // Build UMD and ESM bundles
  {
    input: 'src/index.ts',
    external: ['html2pdf.js', 'docx'],
    output: [
      {
        file: 'dist/srich-editor.umd.js',
        format: 'umd',
        name: 'SRichEditor',
        exports: 'named',
        banner,
        sourcemap: true,
        globals: {
          'html2pdf.js': 'html2pdf',
          'docx': 'docx',
        },
      },
      {
        file: 'dist/srich-editor.esm.js',
        format: 'es',
        exports: 'named',
        banner,
        sourcemap: true,
      },
    ],
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        declarationDir: null,
        sourceMap: true,
      }),
      terser(),
    ],
  },
  // Build type declarations
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/types/index.d.ts',
      format: 'es',
    },
    plugins: [
      dts({
        respectNone: false,
      }),
    ],
  },
];