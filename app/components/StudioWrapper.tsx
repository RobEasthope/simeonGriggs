import {Studio, createConfig} from 'sanity'
import {ClientOnly} from 'remix-utils'
import {deskTool} from 'sanity/desk'
import {codeInput} from '@sanity/code-input'
// import {media} from 'sanity-plugin-media'

import {schemaTypes} from '~/sanity/schema'
import {defaultDocumentNode, structure} from '~/sanity/structure'
import {theme} from '~/sanity/theme'
import {projectDetails} from '~/sanity/projectDetails'

const config = createConfig({
  name: 'simeonGriggs',
  title: 'simeonGriggs.dev',
  theme,
  ...projectDetails(),
  plugins: [
    deskTool({
      structure,
      defaultDocumentNode,
    }),
    codeInput(),
    // media()
  ],
  basePath: `/studio`,
  schema: {
    types: schemaTypes,
  },
})

export default function StudioWrapper() {
  // return <Studio config={config} />
  return <ClientOnly>{() => <Studio config={config} />}</ClientOnly>
}
