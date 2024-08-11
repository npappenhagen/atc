import React from "react"
import {
  Preview,
  PreviewContainer,
  PreviewError,
} from "@/components/live-runner"
import "@/components/live-runner/styles.css"

const tailwindCSS = `
@import url('https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css');
`

const PreviewOnly = ({ element, error }) => {
  return (
    <PreviewContainer>
      <Preview>
        <style>{tailwindCSS}</style>
        {element}
      </Preview>
      {error && <PreviewError>{error}</PreviewError>}
    </PreviewContainer>
  )
}

export default PreviewOnly
