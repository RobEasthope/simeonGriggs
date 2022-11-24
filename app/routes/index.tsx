import type {LinksFunction, MetaFunction} from '@remix-run/node'
import {json} from '@remix-run/node'
import {useLoaderData, useMatches} from '@remix-run/react'

import HomeBlog from '~/components/HomeBlog'
import HomeCommunity from '~/components/HomeCommunity'
import HomeTitle from '~/components/HomeTitle'
import Intro from '~/components/Intro'
import {removeTrailingSlash} from '~/lib/utils/helpers'
import {client, exchangeClient} from '~/sanity/client'
import {urlFor} from '~/sanity/helpers'
import {exchangeParams, exchangeQuery, homeQuery} from '~/sanity/queries'
import styles from '~/styles/app.css'
import type {SiteMeta} from '~/types/siteMeta'
import {articleStubZ} from '~/types/stubs'
import {articleStubsZ, exchangeStubsZ} from '~/types/stubs'

export const handle = {id: `home`}

export const links: LinksFunction = () => {
  return [
    {rel: 'preload', href: styles, as: 'style'},
    {rel: 'stylesheet', href: styles},
  ]
}

export const meta: MetaFunction<typeof loader> = (props) => {
  const {data, parentsData} = props
  const {siteMeta} = parentsData?.root ?? {}

  const article = data.articles.find((a) => a.source === 'blog' && a.image)

  if (!article) {
    return {title: `Article not found`}
  }

  // Create meta image
  const {image} = articleStubZ.parse(article)
  let imageMeta = {}

  if (image?.asset) {
    const ogImageUrl = new URL(`https://og-simeongriggs.vercel.app/api/og`)
    ogImageUrl.searchParams.set(`title`, `Hello, internet!`)
    const imageWidth = 400
    const imageHeight = 630
    const imageUrl = urlFor(image).width(imageWidth).height(imageHeight).auto('format').toString()

    ogImageUrl.searchParams.set(`imageUrl`, imageUrl)

    imageMeta = {
      'og:image:width': 1200,
      'og:image:height': imageHeight,
      'og:image': ogImageUrl.toString(),
    }
  }

  // SEO Meta
  const pageTitle = `${siteMeta.title} | ${siteMeta?.description}`
  const canonical = siteMeta.siteUrl
    ? removeTrailingSlash(new URL(siteMeta.siteUrl).toString())
    : ``

  return {
    title: pageTitle,
    canonical,
    description: String(siteMeta.description),
    'twitter:card': 'summary_large_image',
    'twitter:creator': String(siteMeta?.author),
    'twitter:title': pageTitle,
    'twitter:description': String(siteMeta.description),
    'og:url': canonical,
    'og:title': pageTitle,
    'og:description': String(siteMeta.description),
    'og:type': 'website',
    ...imageMeta,
  }
}

export const loader = async () => {
  // Put site in preview mode if the right query param is used
  // const requestUrl = new URL(request.url)
  // const preview = requestUrl.searchParams.get(`preview`) === process.env.SANITY_PREVIEW_SECRET

  const allArticles = await Promise.all([
    await client.fetch(homeQuery).then((result) => articleStubsZ.parse(result)),
    await exchangeClient
      .fetch(exchangeQuery, exchangeParams)
      .then((result) => exchangeStubsZ.parse(result)),
  ])

  // Sort combined articles by date
  const sortedArticles = allArticles
    .flat()
    .sort((a, b) =>
      a.published && b.published
        ? new Date(b.published).getTime() - new Date(a.published).getTime()
        : 0
    )

  // If a `blog` post isn't the first one, move it to the top
  const firstBlogPostIndex = sortedArticles.findIndex((article) => article.source === `blog`)
  if (firstBlogPostIndex !== 0) {
    const firstBlogPost = sortedArticles[firstBlogPostIndex]
    sortedArticles.splice(firstBlogPostIndex, 1)
    sortedArticles.unshift(firstBlogPost)
  }

  return json({articles: sortedArticles})
}

export default function Index() {
  const {articles} = useLoaderData<typeof loader>()
  const matches = useMatches()
  const siteMeta: SiteMeta = matches?.find((match) => match?.handle?.id === 'root')?.data?.siteMeta

  return (
    <section className="grid grid-cols-1 px-4 md:grid-cols-12 md:px-0 lg:grid-cols-16">
      <div className="flex flex-col gap-y-12 pt-48 pb-12 md:col-span-6 md:col-start-6 md:gap-y-24 md:py-48 lg:col-span-8 lg:col-start-8">
        <HomeTitle title="Hello, internet!" wave />

        {siteMeta?.bio && siteMeta?.bio?.length > 1 ? <Intro value={siteMeta.bio} /> : null}

        {articles.length > 0
          ? articles.map((article) => {
              switch (article.source) {
                case 'blog':
                  return <HomeBlog key={article._id} {...article} />
                case 'exchange':
                  return <HomeCommunity key={article._id} {...article} />
                default:
                  return null
              }
            })
          : null}
      </div>
    </section>
  )
}
