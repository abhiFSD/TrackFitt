import React, { ReactNode } from 'react';
import { Container, Box, Typography, useTheme, useMediaQuery, Link } from '@mui/material';
import Navbar from './Navbar';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const currentYear = new Date().getFullYear();

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        minHeight: '100vh',
        backgroundColor: theme.palette.background.default
      }}
    >
      <Navbar />
      <Container 
        component="main" 
        maxWidth="lg" 
        sx={{ 
          flexGrow: 1, 
          py: { xs: 2, sm: 3, md: 4 },
          px: { xs: 2, sm: 3 },
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {children}
      </Container>
      <Box 
        component="footer" 
        sx={{ 
          py: { xs: 2, sm: 3 }, 
          px: { xs: 2, sm: 3 }, 
          mt: 'auto', 
          textAlign: 'center',
          backgroundColor: theme.palette.grey[100],
          borderTop: `1px solid ${theme.palette.grey[200]}`,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          &copy; {currentYear} HappenAI Fitness App. All rights reserved.
        </Typography>
        <Box sx={{ mt: 1 }}>
          <Link href="#" color="text.secondary" sx={{ mx: 1, fontSize: '0.875rem' }}>
            Terms
          </Link>
          <Link href="#" color="text.secondary" sx={{ mx: 1, fontSize: '0.875rem' }}>
            Privacy
          </Link>
          <Link href="#" color="text.secondary" sx={{ mx: 1, fontSize: '0.875rem' }}>
            Contact
          </Link>
        </Box>
      </Box>
    </Box>
  );
};

export default MainLayout; 