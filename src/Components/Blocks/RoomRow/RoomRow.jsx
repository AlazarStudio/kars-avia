import React from "react";
import { Box } from "@mui/material";

function RoomRow({ dayWidth }) {
    return (
        <Box sx={{ display: 'flex', borderBottom: '1px solid #ddd', height: '30px' }}> {/* Принудительная высота строки */}
            {Array.from({ length: 365 }).map((_, index) => (
                <Box
                    key={index}
                    sx={{
                        width: `${dayWidth}px`,
                        borderRight: index % 7 === 6 ? '2px solid #ddd' : '1px solid #ddd',
                        backgroundColor: '#f9f9f9',
                    }}
                />
            ))}
        </Box>
    );
}

export default RoomRow;
