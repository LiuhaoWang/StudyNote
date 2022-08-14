module.exports = {
  plugins: [
    "@vuepress/back-to-top",
    "@vuepress/active-header-links",
    "@vuepress/nprogress",
    "@vuepress/medium-zoom",
    {
      sidebarLinkSelector: ".sidebar-link",
      headerAnchorSelector: ".header-anchor",
      selector: "img.zoom-custom-imgs",
      options: {
        margin: 16,
      },
    },
  ],
  themeConfig: {
    nav: [
      { text: "运维", items: [{ text: "Linux", link: "/operation/Linux/" }] },
      { text: "消息中间件", items: [{ text: "RabbitMQ", link: "/middleware/RabbitMQ/" }] },
      { text: "NoSQL", items: [{ text: "Redis", link: "/NoSQL/Redis/" }] }
    ],
  },
  smoothScroll: true,
  sidebar: "auto",
  title: "Hello VuePress",
  description: "Just playing around",
  search: true,
  searchMaxSuggestions: 10,
};
