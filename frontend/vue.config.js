module.exports = {
  configureWebpack: {
    devtool: 'source-map',
  },

  devServer: {
    proxy: {
      '/api': {
        target: process.env.VUE_APP_API,
      },
      
      '/auth': {
        target: process.env.VUE_APP_API,
      },
      
      '/login': {
        target: process.env.VUE_APP_API,
      },
      
      '/rss': {
        target: process.env.VUE_APP_API,
      },
      
      '/audio': {
        target: process.env.VUE_APP_API,
      },
    },
  },

  transpileDependencies: [
    'vuetify'
  ]
}
