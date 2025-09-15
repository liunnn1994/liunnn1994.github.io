export const SITE = {
  website: "https://liunian.js.org", // replace this with your deployed domain
  author: "刘念",
  profile: "https://github.com/liunnn1994",
  desc: "A minimal, responsive and SEO-friendly Astro blog theme.",
  title: "刘念的个人博客",
  ogImage: "astropaper-og.jpg",
  lightAndDarkMode: true,
  postPerIndex: 4,
  postPerPage: 4,
  scheduledPostMargin: 15 * 60 * 1000, // 15 minutes
  showArchives: true,
  showBackButton: true, // show back button in post detail
  editPost: {
    enabled: false,
    text: "Edit page",
    url: "https://github.com/liunnn1994/edit/main/",
  },
  dynamicOgImage: true,
  dir: "auto", // "rtl" | "auto"
  lang: "zh-cn", // html lang code. Set this empty and default will be "en"
  timezone: "Asia/Shanghai", // Default global timezone (IANA format) https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
} as const;
