// https://github.com/vitejs/vite/issues/1149#issuecomment-775033930
module.exports = {
    plugins: [
      function () {
        return {
          visitor: {
            MetaProperty(path) {
              path.replaceWithSourceString('process')
            },
          },
        }
      },
    ],
  }
