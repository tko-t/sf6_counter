import { useState } from "react";

export const Modal = (props) => {
  const { showModal, setShowModal } = props;
  if (!showModal) return <></>;

  return (
    <div style={ {
      position: 'fixed',
      left: 0,
      top: 0,
      width: "100%",
      height: "100%",
      background: "rgba(100, 100, 100, .8)",
      overflow: "hidden",
      overscrollBehaviorY: "none",
      zIndex: 2147483647
    } }
    onClick={ () => setShowModal(null) }>
      { props.children }
    </div>
  )
}