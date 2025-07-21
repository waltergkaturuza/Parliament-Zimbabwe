// src/components/shared/FuelStatsCard.tsx
import React, { useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  AlertTitle,
  Box,
  IconButton,
  useTheme
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/api/admin';
import { format, parseISO } from 'date-fns';
import type { FuelStats } from '@/types/fuel';

// Styled Components
const StyledCard = styled(Card)(({ theme }) => ({
  boxShadow: theme.shadows[2],
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
}));

const StyledCardContent = styled(CardContent)(({ theme }) => ({
  padding: theme.spacing(3),
  flexGrow: 1,
}));

const HeaderContainer = styled('div')({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 16,
});

const TitleTypography = styled(Typography)(({ theme }) => ({
  fontSize: 16,
  fontWeight: 500,
  color: theme.palette.text.secondary,
}));

const ValueTypography = styled(Typography)(({ theme }) => ({
  fontSize: 24,
  fontWeight: 700,
  color: theme.palette.text.primary,
}));

const PriceChangeContainer = styled('div')({
  display: 'flex',
  alignItems: 'center',
  marginTop: 4,
});

const PriceChangeIcon = styled('div')<{ trend: 'up' | 'down' | 'stable' }>(
  ({ theme, trend }) => ({
    display: 'flex',
    marginRight: theme.spacing(0.5),
    color:
      trend === 'up'
        ? theme.palette.success.main
        : trend === 'down'
        ? theme.palette.error.main
        : theme.palette.text.secondary,
  })
);

const PriceChangeText = styled(Typography)<{ trend: 'up' | 'down' | 'stable' }>(
  ({ theme, trend }) => ({
    fontSize: '0.875rem',
    color:
      trend === 'up'
        ? theme.palette.success.main
        : trend === 'down'
        ? theme.palette.error.main
        : theme.palette.text.secondary,
  })
);

const DateTypography = styled(Typography)(({ theme }) => ({
  fontSize: '0.75rem',
  color: theme.palette.text.secondary,
  marginTop: theme.spacing(1),
}));

const LoadingContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: 200,
});

// Helper Functions
const getPriceTrend = (
  current: number,
  previous?: number
): 'up' | 'down' | 'stable' => {
  if (previous == null) return 'stable';
  if (current > previous) return 'up';
  if (current < previous) return 'down';
  return 'stable';
};

const formatCurrency = (value?: number) =>
  typeof value === 'number'
    ? parseFloat(value.toString()).toLocaleString(undefined, { // Ensure it's a number before formatting
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : 'N/A';

// Component
const FuelStatsCard: React.FC = () => {
  useEffect(() => {
    console.log('FuelStatsCard mounted');
  }, []);

  const theme = useTheme();

  const {
    data: fuelStats,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery<FuelStats>({
    queryKey: ['fuel-statistics'],
    queryFn: () => {
      console.log('getFuelStatistics function called');
      return adminService.getFuelStatistics();
    },
    refetchInterval: 60000,
    staleTime: 30000,
    retry: 1,
  });

  const handleRefresh = () => refetch();

  if (isLoading) {
    return (
      <StyledCard>
        <StyledCardContent>
          <LoadingContainer>
            <CircularProgress size={40} />
            <Typography variant="body2" sx={{ mt: 2 }}>
              Loading fuel price data...
            </Typography>
          </LoadingContainer>
        </StyledCardContent>
      </StyledCard>
    );
  }

  if (isError) {
    return (
      <StyledCard>
        <StyledCardContent>
          <Alert
            severity="error"
            action={
              <IconButton
                aria-label="refresh"
                color="inherit"
                size="small"
                onClick={handleRefresh}
                disabled={isRefetching}
              >
                <RefreshIcon fontSize="inherit" />
              </IconButton>
            }
          >
            <AlertTitle>Error loading fuel prices</AlertTitle>
            {error instanceof Error ? error.message : 'An unknown error occurred'}
          </Alert>
        </StyledCardContent>
      </StyledCard>
    );
  }

  const petrolTrend = getPriceTrend(
    fuelStats?.petrol_price ?? 0,
    fuelStats?.previous_petrol_price ?? undefined
  );
  const dieselTrend = getPriceTrend(
    fuelStats?.diesel_price ?? 0,
    fuelStats?.previous_diesel_price ?? undefined
  );

  return (
    <StyledCard>
      <StyledCardContent>
        <HeaderContainer>
          <TitleTypography>Fuel Price Statistics</TitleTypography>
          <IconButton
            size="small"
            onClick={handleRefresh}
            disabled={isRefetching}
            aria-label="refresh fuel prices"
          >
            <RefreshIcon fontSize="small" />
          </IconButton>
        </HeaderContainer>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Petrol */}
          <div>
            <ValueTypography>{formatCurrency(fuelStats?.petrol_price ?? 0)}</ValueTypography>
            <Typography color="text.secondary">Petrol Price</Typography>
            <PriceChangeContainer>
              <PriceChangeIcon trend={petrolTrend}>
                {petrolTrend === 'up' && <TrendingUpIcon fontSize="small" />}
                {petrolTrend === 'down' && <TrendingDownIcon fontSize="small" />}
                {petrolTrend === 'stable' && <CheckCircleOutlineIcon fontSize="small" />}
              </PriceChangeIcon>
              <PriceChangeText trend={petrolTrend}>
                {petrolTrend === 'up'
                  ? 'Increased'
                  : petrolTrend === 'down'
                  ? 'Decreased'
                  : 'No change'}
                {fuelStats?.petrol_price_change != null &&
                  ` by ${parseFloat(fuelStats.petrol_price_change.toString()).toFixed(2)}`}
              </PriceChangeText>
            </PriceChangeContainer>
          </div>

          {/* Diesel */}
          <div style={{ flex: '1', minWidth: '200px' }}>
            <ValueTypography>{formatCurrency(parseFloat((fuelStats?.diesel_price ?? 0).toString()))}</ValueTypography>
            <Typography color="text.secondary">Diesel Price</Typography>
            <PriceChangeContainer>
              <PriceChangeIcon trend={dieselTrend}>
                {dieselTrend === 'up' && <TrendingUpIcon fontSize="small" />}
                {dieselTrend === 'down' && <TrendingDownIcon fontSize="small" />}
                {dieselTrend === 'stable' && <CheckCircleOutlineIcon fontSize="small" />}
              </PriceChangeIcon>
              <PriceChangeText trend={dieselTrend}>
                {dieselTrend === 'up'
                  ? 'Increased'
                  : dieselTrend === 'down'
                  ? 'Decreased'
                  : 'No change'}
                {fuelStats?.diesel_price_change != null &&
                  ` by ${parseFloat(fuelStats.diesel_price_change.toString()).toFixed(2)}`}
              </PriceChangeText>
            </PriceChangeContainer>
          </div>

          {/* Last Updated */}
          <div style={{ width: '100%', marginTop: '16px' }}>
            <DateTypography>
              Last updated:{' '}
              {fuelStats?.timestamp
                ? format(parseISO(fuelStats.timestamp), 'MMM d, yyyy h:mm a') // Changed format to include year
                : 'N/A'}
            </DateTypography>
          </div>
        </div>
      </StyledCardContent>
    </StyledCard>
  );
};

export default FuelStatsCard;
