import React from "react"

import CodeBlock from "@/components/mdx/code-block"

type Props = {
  live?: boolean
  children?: React.ReactNode
}

export default function Pre({ live, children, ...props }: Props) {
  if (React.isValidElement(children) && children.type === "code") {
    return (
      <div {...props}>
        <CodeBlock live={live} {...children.props} />
      </div>
    )
  }
  return <pre {...props}>{children}</pre>
}
