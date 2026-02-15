module.exports = function (options) {
  const lazyImports = [
    '@mikro-orm/core',
    '@nestjs/mongoose',
    '@nestjs/sequelize',
    '@nestjs/sequelize/dist/common/sequelize.utils',
    '@nestjs/typeorm',
    '@nestjs/typeorm/dist/common/typeorm.utils',
  ];

  return {
    ...options,
    externals: {
      'bcrypt': 'commonjs bcrypt',
    },
    module: {
      ...options.module,
      rules: [
        ...options.module.rules,
        {
          test: /\.(js\.map|d\.ts)$/,
          loader: 'ignore-loader',
        },
      ],
    },
    plugins: [
      ...options.plugins,
      new (require('webpack').IgnorePlugin)({
        checkResource(resource) {
          if (!lazyImports.includes(resource)) {
            return false;
          }
          try {
            require.resolve(resource);
          } catch (err) {
            return true;
          }
          return false;
        },
      }),
    ],
  };
};
