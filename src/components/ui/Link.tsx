import type { ComponentPropsWithoutRef } from 'react'
import { forwardRef } from 'react'

const Link = forwardRef<HTMLAnchorElement, ComponentPropsWithoutRef<'a'>>(
  function Link(props, ref) {
    return <a {...props} ref={ref} />
  }
)

export default Link
