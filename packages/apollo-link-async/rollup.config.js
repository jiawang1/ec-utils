import json from 'rollup-plugin-json';
import babel from 'rollup-plugin-babel';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import uglify from 'rollup-plugin-uglify';
import sizes from 'rollup-plugin-sizes';
import pkg from './package.json';

const config = {
  input: 'index.js',
  sourcemap: true,
  plugins: [
    json(),
    resolve({
      jsnext: true,
      main: true,
      preferBuiltins: false
    }),
    commonjs({
      exclude: 'src/**',
      namedExports: {
        'node_modules/graphql-anywhere/lib/async.js': ['graphql'],
        '../../node_modules/graphql-anywhere/lib/async.js': ['graphql']
      }
    }),
    babel({
      exclude: ['node_modules/**', '../../node_modules/**'],
      runtimeHelpers: true
    })
  ]
};

const buildESModule = mode => {
  const plugins = config.plugins.slice();
  if (mode === 'development') {
    plugins.push(sizes());
  }
  return Object.assign(
    {
      output: {
        file: `es/${pkg.name.indexOf('/') > 0 ? pkg.name.split('/')[1] : pkg.name}.bundle.js`,
        format: 'es'
      }
    },
    config,
    {
      watch: {
        include: 'src/**'
      }
    },
    { plugins }
  );
};

const buildCJS = () => {
  const plugins = config.plugins.slice();
  plugins.push(uglify());
  return Object.assign(
    {
      output: {
        file: `dist/${pkg.name.indexOf('/') > 0 ? pkg.name.split('/')[1] : pkg.name}.bundle.min.js`,
        format: 'cjs'
      }
    },
    config,
    { plugins }
  );
};
const build = mode => {
  if (mode === 'development') {
    return buildESModule(mode);
  }
  return [buildESModule(mode), buildCJS()];
};

export default build(process.env.NODE_ENV);
