import { useState, useEffect } from "react";

export function useWindowSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  useEffect(() => {
    const onResize = () =>
      setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return size;
}

// const [width, setWindowWidth] = useState(window.innerWidth);

// useEffect(() => {
//   const handleResize = () => setWindowWidth(window.innerWidth);
//   window.addEventListener("resize", handleResize);

//   return () => window.removeEventListener("resize", handleResize);
// }, []);
