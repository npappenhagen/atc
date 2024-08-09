"use client"

import {
  LiveProvider,
  LiveEditor,
  LivePreview,
  LiveError,
} from "react-live-runner"

import * as React from "react"

export default function LiveEdit({ children, startCodeBlock, ...props }: any) {
  return (
    <LiveProvider code={startCodeBlock}>
      <LiveEditor />
      <LivePreview />
      <LiveError />
    </LiveProvider>
  )
}
