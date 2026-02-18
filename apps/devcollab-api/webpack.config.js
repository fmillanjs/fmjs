module.exports = function (options) {
  const lazyImports = [
    '@mikro-orm/core',
    '@nestjs/mongoose',
    '@nestjs/sequelize',
    '@nestjs/typeorm',
  ];

  return {
    ...options,
    externals: {
      'bcrypt': 'commonjs bcrypt',
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
