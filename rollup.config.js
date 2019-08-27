// import babel from 'rollup-plugin-babel';
import buble from 'rollup-plugin-buble';
import { terser } from 'rollup-plugin-terser';

export default {
  input: 'app/main.js',
  output: {
    dir: 'public/app/',
    format: 'iife'
  },
  plugins: [
    buble({
      transforms: { asyncAwait: false, dangerousForOf: true }
    }),
    terser()
  ]
};
