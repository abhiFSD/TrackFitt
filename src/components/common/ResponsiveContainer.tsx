import React, { ReactNode } from 'react';
import { Box, Container, SxProps, Theme, useTheme, useMediaQuery } from '@mui/material';

interface ResponsiveContainerProps {
  children: ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
  disableGutters?: boolean;
  sx?: SxProps<Theme>;
  fullWidth?: boolean;
  fullHeight?: boolean;
  centerContent?: boolean;
  spacing?: number;
  mobileSpacing?: number;
  backgroundColor?: string;
  paddingTop?: number | string;
  paddingBottom?: number | string;
  mobilePaddingTop?: number | string;
  mobilePaddingBottom?: number | string;
}

/**
 * A responsive container component with additional layout options beyond MUI Container
 */
const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  maxWidth = 'lg',
  disableGutters = false,
  sx = {},
  fullWidth = false,
  fullHeight = false,
  centerContent = false,
  spacing = 3,
  mobileSpacing,
  backgroundColor,
  paddingTop,
  paddingBottom,
  mobilePaddingTop,
  mobilePaddingBottom,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const effectiveSpacing = isMobile && mobileSpacing !== undefined ? mobileSpacing : spacing;
  const effectivePaddingTop = isMobile && mobilePaddingTop !== undefined ? mobilePaddingTop : paddingTop;
  const effectivePaddingBottom = isMobile && mobilePaddingBottom !== undefined ? mobilePaddingBottom : paddingBottom;
  
  return (
    <Container
      maxWidth={maxWidth}
      disableGutters={disableGutters}
      sx={{
        width: fullWidth ? '100%' : 'auto',
        height: fullHeight ? '100%' : 'auto',
        minHeight: fullHeight ? '100vh' : 'auto',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: centerContent ? 'center' : 'flex-start',
        alignItems: centerContent ? 'center' : 'stretch',
        py: effectiveSpacing,
        pt: effectivePaddingTop !== undefined ? effectivePaddingTop : undefined,
        pb: effectivePaddingBottom !== undefined ? effectivePaddingBottom : undefined,
        backgroundColor: backgroundColor,
        ...sx,
      }}
    >
      {children}
    </Container>
  );
};

export default ResponsiveContainer; 