const config = {
  siteTitle: "ottimo",
  siteTitleShort: "ottimo",
  siteTitleAlt: "ottimo.site WPO",
  siteLogo: "../src/assets/Logo/logo-ottimo.svg",
  siteUrl: "https://ottimo.site",
  pathPrefix: "/",
  siteDescription:
    "Your one stop solution for web performance optimisation services, let's make your site or app work better for your customers and yor business.",
  dateFromFormat: "DD-MM-YYYY", // Date format used in the frontmatter.
  dateFormat: "DD/MM/YYYY", // Date format for display.
  postsPerPage: 4, // Amount of posts displayed per listing page.
  userName: "Adrian Badiu", // Username to display in the author segment.
  userEmail: "adrian@abadiu.xyz", // Email used for RSS feed's author segment
  userTwitter: "AdrianBadiu", // Optionally renders "Follow Me" in the UserInfo segment.
  userLocation: "Southampton, UK", // User location to display in the author segment.
  userAvatar: "https://api.adorable.io/avatars/150/test.png", // User avatar to display in the author segment.
  userDescription:
    "Yeah, I like animals better than people sometimes... Especially dogs. Dogs are the best. Every time you come home, they act like they haven't seen you in a year. And the good thing about dogs... is they got different dogs for different people.", // User description to display in the author segment.
  // Links to social profiles/projects you want to display in the author segment/navigation bar.
  userLinks: [
    {
      label: "GitHub",
      url: "https://github.com/abadiu/abadiu",
      iconClassName: "fa fa-github",
    },
    {
      label: "Twitter",
      url: "https://twitter.com/AdrianBadiu",
      iconClassName: "fa fa-twitter",
    },
    {
      label: "Email",
      url: "mailto:adrian@abadiu.xyz",
      iconClassName: "fa fa-envelope",
    },
  ],
  copyright: "Copyright © 2020. Adrian Badiu", // Copyright string for the footer of the website and RSS feed.
  themeColor: "#c62828", // Used for setting manifest and progress theme colors.
  backgroundColor: "#e0e0e0", // Used for setting manifest background color.
}

// Validate

// Make sure pathPrefix is empty if not needed
if (config.pathPrefix === "/") {
  config.pathPrefix = ""
} else {
  // Make sure pathPrefix only contains the first forward slash
  config.pathPrefix = `/${config.pathPrefix.replace(/^\/|\/$/g, "")}`
}

// Make sure siteUrl doesn't have an ending forward slash
if (config.siteUrl.substr(-1) === "/")
  config.siteUrl = config.siteUrl.slice(0, -1)

// Make sure siteRss has a starting forward slash
if (config.siteRss && config.siteRss[0] !== "/")
  config.siteRss = `/${config.siteRss}`

module.exports = config
