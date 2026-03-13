import React, { ReactNode } from 'react';
import { Grid, Box, SxProps, Theme, useTheme, useMediaQuery } from '@mui/material';

interface ResponsiveGridProps {
  children: ReactNode;
  spacing?: number;
  mobileSpacing?: number;
  tabletSpacing?: number;
  container?: boolean;
  item?: boolean;
  xs?: number | 'auto' | boolean;
  sm?: number | 'auto' | boolean;
  md?: number | 'auto' | boolean;
  lg?: number | 'auto' | boolean;
  xl?: number | 'auto' | boolean;
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline';
  direction?: 'row' | 'row-reverse' | 'column' | 'column-reverse';
  mobileDirection?: 'row' | 'row-reverse' | 'column' | 'column-reverse';
  wrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
  sx?: SxProps<Theme>;
  fullWidth?: boolean;
  fullHeight?: boolean;
  paddingTop?: number | string;
  paddingBottom?: number | string;
  mobilePaddingTop?: number | string;
  mobilePaddingBottom?: number | string;
}

/**
 * A responsive grid component with enhanced properties for better control over mobile layouts
 */
const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  spacing = 2,
  mobileSpacing,
  tabletSpacing,
  container = false,
  item = false,
  xs,
  sm,
  md,
  lg,
  xl,
  justifyContent = 'flex-start',
  alignItems = 'flex-start',
  direction = 'row',
  mobileDirection,
  wrap = 'wrap',
  sx = {},
  fullWidth = false,
  fullHeight = false,
  paddingTop,
  paddingBottom,
  mobilePaddingTop,
  mobilePaddingBottom,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  const effectiveSpacing = isMobile && mobileSpacing !== undefined ? 
    mobileSpacing : 
    (isTablet && tabletSpacing !== undefined ? tabletSpacing : spacing);
  
  const effectiveDirection = isMobile && mobileDirection ? mobileDirection : direction;
  
  const effectivePaddingTop = isMobile && mobilePaddingTop !== undefined ? mobilePaddingTop : paddingTop;
  const effectivePaddingBottom = isMobile && mobilePaddingBottom !== undefined ? mobilePaddingBottom : paddingBottom;
  
  return (
    <Grid
      container={container}
      item={item}
      xs={xs}
      sm={sm}
      md={md}
      lg={lg}
      xl={xl}
      spacing={effectiveSpacing}
      justifyContent={justifyContent}
      alignItems={alignItems}
      direction={effectiveDirection}
      wrap={wrap}
      sx={{
        width: fullWidth ? '100%' : 'auto',
        height: fullHeight ? '100%' : 'auto',
        pt: effectivePaddingTop,
        pb: effectivePaddingBottom,
        ...sx,
      }}
    >
      {children}
    </Grid>
  );
};

export default ResponsiveGrid; 