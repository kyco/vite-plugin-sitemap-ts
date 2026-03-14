import { createRootRoute, Outlet } from '@tanstack/react-router'

import Menu from '~/components/Menu'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <>
      <Menu />
      <Outlet />
    </>
  )
}
