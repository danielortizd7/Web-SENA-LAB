import React from "react";
import { Button } from "@mui/material";

const CustomButton = ({ text, onClick, variant = "contained", color = "primary" }) => {
  return (
    <Button
      variant={variant}
      color={color}
      onClick={onClick}
      sx={{
        backgroundColor: color === "primary" ? "#39A900" : "#00324D",
        color: "white",
        fontWeight: "bold",
        "&:hover": {
          backgroundColor: color === "primary" ? "#2E7D00" : "#002A3A",
        },
      }}
    >
      {text}
    </Button>
  );
};

export default CustomButton;
