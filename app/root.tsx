import {PortableTextComponentsProvider} from '@portabletext/react'
import type {MetaFunction} from '@remix-run/node'
import {json} from '@remix-run/node'
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useLocation,
} from '@remix-run/react'

import {projectDetails} from '~/sanity/config'
import {components} from './components/PortableText/components'

export const meta: MetaFunction = () => ({
  charset: 'utf-8',
  title: 'New Remix + Sanity Studio v3 App',
  viewport: 'width=device-width,initial-scale=1',
})

export async function loader() {
  return json({ENV: projectDetails()})
}

export default function App() {
  const data = useLoaderData()

  const {pathname} = useLocation()
  const isStudioRoute = pathname.startsWith('/studio')

  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
        {isStudioRoute && typeof document === 'undefined' ? '__STYLES__' : null}
      </head>
      <body className="min-h-screen">
        <PortableTextComponentsProvider components={components}>
          <Outlet />
        </PortableTextComponentsProvider>
        <ScrollRestoration />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${JSON.stringify(data.ENV)}`,
          }}
        />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  )
}
