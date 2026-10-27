import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import postcss from 'rollup-plugin-postcss';
import dts from 'rollup-plugin-dts';

const banner = `/*!
 * SRich Editor v1.0.0
 * A lightweight, dependency-free rich text editor
 * MIT License
 */`;

export default [
  // Build CSS
  {
    input: 'src/styles.css',
    output: {
      file: 'dist/styles.css',
    },
    plugins: [
      postcss({
        extract: 'styles.css',
        minimize: true,
      }),
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