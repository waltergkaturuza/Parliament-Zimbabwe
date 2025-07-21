// components/Dashboard/SummaryCard.tsx
import { FC } from "react";
import { Card, CardContent, Typography, Box } from "@mui/material";
import Icon from "@mui/material/Icon";

interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: string;
  color?: string;
}

const SummaryCard: FC<SummaryCardProps> = ({ title, value, icon, color = "#1976d2" }) => (
  <Card sx={{ display: "flex", alignItems: "center", p: 2 }}>
    <Box
      sx={{
        bgcolor: color,
        borderRadius: "50%",
        height: 48,
        width: 48,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        mr: 2,
        color: "#fff",
      }}
    >
      <Icon>{icon}</Icon>
    </Box>
    <CardContent sx={{ padding: "0 !important" }}>
      <Typography variant="subtitle2" color="textSecondary">
        {title}
      </Typography>
      <Typography variant="h6">{value}</Typography>
    </CardContent>
  </Card>
);

export default SummaryCard;
