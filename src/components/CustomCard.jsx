import React from "react";
import { Card, CardContent, Typography, Box } from "@mui/material";

const CustomCard = ({ title, value, color }) => {
  return (
    <Card sx={{ minWidth: 275, boxShadow: 3, borderLeft: `5px solid ${color}` }}>
      <CardContent>
        <Typography variant="h6" sx={{ color: color, fontWeight: "bold" }}>
          {title}
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: "bold" }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default CustomCard;
