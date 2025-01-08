import { Box, CircularProgress, Typography } from '@mui/material';

function LoadingScreen() {
  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
      }}
    >
      <CircularProgress size={48} />
      <Typography variant='h6' color='textSecondary'>
        Loading...
      </Typography>
    </Box>
  );
}

export default LoadingScreen;
