import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/about')({
  component: Home,
})

function Home() {
  return (
    <>
      <h2>About</h2>
      <p style={{ marginLeft: '20px' }}>
        View: <a href="/sitemap.xml">/sitemap.xml</a>
      </p>
    </>
  )
}
