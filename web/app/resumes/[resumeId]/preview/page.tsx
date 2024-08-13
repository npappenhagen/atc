"use client"

import React, { useEffect, useRef } from "react"

export default function PreviewPage() {
  const iframeRef = useRef(null)

  useEffect(() => {
    const previewHtml = localStorage.getItem("previewHtml")
    if (iframeRef.current && previewHtml) {
      const iframe = iframeRef.current
      const doc = iframe.contentDocument || iframe.contentWindow.document
      doc.open()
      doc.write(previewHtml)
      doc.close()
    }
  }, [])

  return (
    <div className="w-full h-full" id="resume-preview-container">
      <iframe ref={iframeRef} className="w-full h-screen border-none" />
    </div>
  )
}
