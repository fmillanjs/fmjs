const nodeExternals = require('webpack-node-externals');

module.exports = function (options, webpack) {
  return {
    ...options,
    externals: [
      nodeExternals({
        // Include these packages that cause issues with webpack
        allowlist: [],
      }),
    ],
    module: {
      ...options.module,
      rules: [
        ...options.module.rules,
        {
          // Ignore .d.ts and .map files
          test: /\.(d\.ts|js\.map)$/,
          use: 'null-loader',
        },
      ],
    },
  };
};
