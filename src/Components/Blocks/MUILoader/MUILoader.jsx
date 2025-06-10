import React from "react";
import classes from "./MUILoader.module.css";
import { Box, CircularProgress } from "@mui/material";

function MUILoader({ children, fullHeight, loadSize, ...props }) {
  return (
    <>
      <Box
        sx={{
          // width: "100%",
        //   position: "fixed",
        //   top: 0,
        //   left: 0,
        //   width: "100vw",
          height: fullHeight ? fullHeight : "100%",
          // backgroundColor: "rgba(0, 0, 0, 0.5)", // Затемнённый фон
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1300, // Выше других элементов
        }}
      >
        <CircularProgress
          sx={{
            width: `${ loadSize ? loadSize : '60px'} !important`,
            height: `${loadSize ? loadSize : '60px'} !important`,
            //   color: "#fff",
          }}
        />
      </Box>
    </>
  );
}

export default MUILoader;
