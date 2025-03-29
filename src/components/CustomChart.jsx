import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, Typography } from "@mui/material";

const data = [
  { name: "Enero", cantidad: 120 },
  { name: "Febrero", cantidad: 90 },
  { name: "Marzo", cantidad: 150 },
  { name: "Abril", cantidad: 180 },
  { name: "Mayo", cantidad: 220 },
];

const CustomChart = () => {
  return (
    <Card sx={{ boxShadow: 3, marginTop: 2 }}>
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: "bold", marginBottom: 2 }}>
          Análisis de Muestras por Mes
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="cantidad" fill="#39A900" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default CustomChart;
