module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './src',
            '@/domain': './src/domain',
            '@/infrastructure': './src/infrastructure',
            '@/presentation': './src/presentation',
            '@/application': './src/application',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
