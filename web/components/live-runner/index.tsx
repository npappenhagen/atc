"use client"

import styled from "styled-components"
import { CodeMirror as CM } from "react-runner-codemirror"
import "./styles.css"

export const CodeMirror = styled(CM)`
  font-size: 14px;
  flex: 0 1 720px;
  overflow: hidden;
`

export const PreviewContainer = styled.div`
  flex: 1 1 720px;
  position: relative;
  display: flex;
  overflow: hidden;
`

export const Preview = styled.div`
  margin: auto;
  white-space: pre-wrap;
  max-width: 100%;
  max-height: 100%;
  overflow: auto;
`

export const PreviewError = styled.div`
  background: #fcc;
  position: absolute;
  top: 0;
  left: 0;npm i
  min-width: 100%;
  margin: 0;
  padding: 10px;
  color: #f00;
  white-space: pre-wrap;
`
