export const HBox = (props) => {
  const style = {
    display: "flex",
    flexWrap: "noWrap",
    padding: "10px",
    gap: "20px",
    alignItems: 'center',
  }

  return (
    <div style={style}>{ props.children }</div>
  )
}