import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return (
    <>
      <h1>
        <code>vite-plugin-sitemap-ts basic</code>
      </h1>
      <p style={{ marginLeft: '20px' }}>
        View: <a href="/sitemap.xml">/sitemap.xml</a>
      </p>
    </>
  )
}
