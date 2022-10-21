import {PortableTextComponentsProvider} from '@portabletext/react'
import type {LinksFunction, LoaderArgs, MetaFunction} from '@remix-run/node'
import {json} from '@remix-run/node'
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useCatch,
  useLoaderData,
} from '@remix-run/react'
import {z} from 'zod'

import {projectDetails} from '~/sanity/projectDetails'
import Banner from '~/components/Banner'
import Grid from '~/components/Grid'
import Header from '~/components/Header'
import {components} from '~/components/PortableText/components'
import {client} from '~/sanity/client'
import {siteMetaQuery} from '~/sanity/queries'
import {siteMetaZ} from '~/types/siteMeta'
import {themePreferenceCookie} from '~/cookies'

export const handle = {id: `root`}

export const meta: MetaFunction = ({data}) => ({
  charset: 'utf-8',
  title: 'New Remix + Sanity Studio v3 App',
  viewport: 'width=device-width,initial-scale=1',
  'theme-color': '#2522fc',
  'color-scheme': data?.themePreference ?? 'light',
  type: 'website',
})

const fonts = [
  `/fonts/JetBrainsMono-Regular.woff2`,
  `/fonts/JetBrainsMono-Bold.woff2`,
  `/fonts/Inter-roman.var.woff2?v=3.19`,
  `/fonts/Inter-italic.var.woff2?v=3.19`,
]

export const links: LinksFunction = () => {
  return [
    ...fonts.map((href: string) => ({
      rel: 'preload',
      as: 'font',
      href,
      type: 'font/woff2',
      // crossOrigin: 'anonymous',
    })),
    {
      rel: 'alternate',
      type: 'application/rss+xml',
      href: `/feed.xml`,
      title: 'XML Feed',
    },
  ]
}

export const loader = async ({request}: LoaderArgs) => {
  const {pathname} = new URL(request.url)
  const isStudioRoute = pathname.startsWith('/studio')

  // Dark/light mode
  const cookieHeader = request.headers.get('Cookie')
  const cookie = (await themePreferenceCookie.parse(cookieHeader)) || {}
  const themePreference = z
    .union([z.literal('dark'), z.literal('light')])
    .optional()
    .parse(cookie.themePreference)

  const siteMeta = isStudioRoute
    ? null
    : await client.fetch(siteMetaQuery).then((res) => siteMetaZ.parse(res))

  return json({
    siteMeta,
    isStudioRoute,
    themePreference,
    ENV: {
      ...projectDetails(),
      NODE_ENV: process.env.NODE_ENV,
    },
  })
}

export default function App() {
  const {siteMeta, isStudioRoute, themePreference, ENV} = useLoaderData<typeof loader>()

  // Use browser default if cookie is not set
  const isDarkMode =
    !themePreference && typeof document !== 'undefined'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : themePreference === `dark`
  const bodyClassNames = [
    `transition-colors duration-1000 ease-in-out min-h-screen`,
    isDarkMode ? `dark bg-blue-900 text-white` : `bg-white`,
  ]
    .join(' ')
    .trim()

  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
        {isStudioRoute && typeof document === 'undefined' ? '__STYLES__' : null}
      </head>
      <body className={bodyClassNames}>
        {isStudioRoute ? (
          <Outlet />
        ) : (
          <>
            {siteMeta ? <Header {...siteMeta} /> : null}
            <Banner />
            <PortableTextComponentsProvider components={components}>
              <Outlet />
            </PortableTextComponentsProvider>
            {ENV.NODE_ENV !== 'production' ? <Grid /> : null}
            <ScrollRestoration />
          </>
        )}
        <script
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${JSON.stringify(ENV)}`,
          }}
        />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  )
}

export function ErrorBoundary({error}: {error: Error}) {
  return (
    <html>
      <head>
        <title>{error.message}</title>
        <Meta />
        <Links />
      </head>
      <body className="p-12">
        <div className="container prose mx-auto lg:prose-xl">
          <h1>Yikes</h1>
          <p>{error.message}</p>
          <pre>{error.stack}</pre>
        </div>
        <Scripts />
      </body>
    </html>
  )
}

export function CatchBoundary() {
  const caught = useCatch()

  return (
    <html>
      <head>
        <title>Oh no</title>
        <Meta />
        <Links />
      </head>
      <body className="p-12">
        <div className="container prose mx-auto lg:prose-xl">
          <h1>
            {caught.status} {caught.statusText}
          </h1>
          <p>
            <a href="/">Go home</a>
          </p>
        </div>
        <Scripts />
      </body>
    </html>
  )
}
