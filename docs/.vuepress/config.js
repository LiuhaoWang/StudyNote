module.exports = {
  plugins: ['@vuepress/back-to-top','@vuepress/active-header-links','@vuepress/nprogress','@vuepress/medium-zoom',{
    sidebarLinkSelector: '.sidebar-link',
    headerAnchorSelector: '.header-anchor',
    selector: 'img.zoom-custom-imgs',
      options: {
        margin: 16
      }
  }],
  themeConfig: {
  
  },
  smoothScroll: true,
  sidebar: 'auto',
  title: "Hello VuePress",
  description: "Just playing around",
  search: true,
  searchMaxSuggestions: 10
};
