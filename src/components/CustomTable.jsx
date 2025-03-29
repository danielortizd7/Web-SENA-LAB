import React from "react";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from "@mui/material";

const CustomTable = ({ data }) => {
  return (
    <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
      <Table>
        <TableHead sx={{ backgroundColor: "#39A900" }}> {/* Verde institucional */}
          <TableRow>
            <TableCell sx={{ color: "white", fontWeight: "bold" }}>ID</TableCell>
            <TableCell sx={{ color: "white", fontWeight: "bold" }}>Nombre</TableCell>
            <TableCell sx={{ color: "white", fontWeight: "bold" }}>Correo</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row, index) => (
            <TableRow key={index}>
              <TableCell>{row.id}</TableCell>
              <TableCell>{row.name}</TableCell>
              <TableCell>{row.email}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default CustomTable;
    