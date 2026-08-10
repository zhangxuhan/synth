interface Props {
  message: string
}

export function Toast({ message }: Props) {
  if (!message) return null
  return (
    <div className="toast" role="status">
      {message}
    </div>
  )
}
