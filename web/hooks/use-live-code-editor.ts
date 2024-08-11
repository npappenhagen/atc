import { useLiveRunner } from "react-live-runner"

export const useLiveCodeEditor = (initialCode, options = {}) => {
  const { code, onChange, error, element } = useLiveRunner({
    initialCode,
    ...options,
  })

  return {
    code,
    setCode: onChange,
    element,
    error,
  }
}

export default useLiveCodeEditor
