module.exports = {
  siteMetadata: {
    title: `ottimo`,
    description: `Your one stop solution for web performance optimisation services, let's make your site or app work better for your customers and yor business.`,
    siteUrl: `https://ottimo.site`,
    author: `@abadiu`,
  },
  plugins: [
    `gatsby-plugin-image`,
    `gatsby-plugin-postcss`,
    `gatsby-plugin-react-helmet`,
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `assets`,
        path: `${__dirname}/src/assets`,
      },
    },
    `gatsby-transformer-sharp`,
    `gatsby-plugin-sharp`,
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `ottimo`,
        short_name: `ottimo`,
        start_url: `/`,
        background_color: `#ffffff`,
        theme_color: `#12b886`,
        display: `standalone`,
        icon: `src/assets/logo-ottimo.svg`, // This path is relative to the root of the site.
      },
    },
    `gatsby-plugin-offline`,
    `gatsby-plugin-sitemap`,
  ],
}
