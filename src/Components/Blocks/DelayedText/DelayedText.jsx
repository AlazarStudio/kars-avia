import React, { useEffect, useRef, useState } from "react";

function DelayedText({ show, delay = 300, children }) {
  const [visible, setVisible] = useState(show);
  const t = useRef(null);

  useEffect(() => {
    clearTimeout(t.current);
    if (show) t.current = setTimeout(() => setVisible(true), delay);
    else setVisible(false);
    return () => clearTimeout(t.current);
  }, [show, delay]);

  return visible ? <>{children}</> : null;
}

export default DelayedText;
