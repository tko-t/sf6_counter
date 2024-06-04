export const HBox = (props) => {
  const style = {
    display: "flex",
    flexWrap: "wrap",
    padding: "10px",
    gap: "20px",
  }

  return (
    <div style={style}>{ props.children }</div>
  )
}