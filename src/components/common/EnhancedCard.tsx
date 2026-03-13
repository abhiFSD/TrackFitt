import React, { ReactNode } from 'react';
import { 
  Card, 
  CardProps, 
  CardContent, 
  CardHeader, 
  CardActions, 
  Typography, 
  Box, 
  useTheme, 
  Divider, 
  styled,
  alpha,
  useMediaQuery
} from '@mui/material';

// Styled components for gradient backgrounds
const GradientCard = styled(Card)<{ $variant?: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' }>(
  ({ theme, $variant }) => {
    if (!$variant) return {};
    
    const colorMap = {
      primary: theme.palette.primary,
      secondary: theme.palette.secondary,
      success: theme.palette.success,
      info: theme.palette.info,
      warning: theme.palette.warning,
      error: theme.palette.error
    };
    
    const color = colorMap[$variant];
    
    return {
      background: `linear-gradient(135deg, ${color.main} 0%, ${color.dark} 100%)`,
      color: color.contrastText,
      '& .MuiCardHeader-title, & .MuiCardHeader-subheader': {
        color: color.contrastText,
      },
      '& .MuiCardHeader-subheader': {
        opacity: 0.8,
      },
    };
  }
);

export interface EnhancedCardProps extends Omit<CardProps, 'variant'> {
  title?: string;
  subheader?: string;
  headerAction?: React.ReactNode;
  footer?: React.ReactNode;
  variant?: 'outlined' | 'elevation' | 'gradient';
  gradientColor?: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error';
  borderColor?: string;
  noPadding?: boolean;
  hoverable?: boolean;
  headerDivider?: boolean;
  footerDivider?: boolean;
  maxWidth?: number | string;
  minHeight?: number | string;
  textAlign?: 'left' | 'center' | 'right';
  icon?: React.ReactNode;
  elevation?: number;
  className?: string;
}

const EnhancedCard: React.FC<EnhancedCardProps> = ({
  title,
  subheader,
  headerAction,
  footer,
  variant = 'elevation',
  gradientColor = 'primary',
  borderColor,
  noPadding = false,
  hoverable = false,
  headerDivider = false,
  footerDivider = true,
  maxWidth,
  minHeight,
  textAlign = 'left',
  icon,
  elevation = 1,
  className,
  children,
  ...rest
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const cardStyle = {
    maxWidth: maxWidth || 'auto',
    minHeight: minHeight || 'auto',
    textAlign,
    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
    border: variant === 'outlined' ? `1px solid ${borderColor || theme.palette.divider}` : 'none',
    ...(hoverable && {
      '&:hover': {
        transform: isMobile ? 'none' : 'translateY(-4px)',
        boxShadow: isMobile ? 'none' : `0 12px 20px -10px ${alpha(theme.palette.common.black, 0.15)}`
      },
    }),
  };
  
  const getCardContent = () => {
    const headerProps = {
      title: title && (
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            fontWeight: 600,
            fontSize: isMobile ? '1rem' : '1.25rem'
          }}
        >
          {title}
        </Typography>
      ),
      subheader: subheader && (
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{ 
            fontSize: isMobile ? '0.875rem' : '0.875rem'
          }}
        >
          {subheader}
        </Typography>
      ),
      action: headerAction,
      avatar: icon,
    };
    
    return (
      <>
        {(title || subheader || headerAction || icon) && (
          <>
            <CardHeader {...headerProps} />
            {headerDivider && <Divider />}
          </>
        )}
        
        <CardContent sx={{ p: noPadding ? 0 : isMobile ? 2 : 3 }}>
          {children}
        </CardContent>
        
        {footer && (
          <>
            {footerDivider && <Divider />}
            <CardActions sx={{ p: isMobile ? 1.5 : 2 }}>
              {footer}
            </CardActions>
          </>
        )}
      </>
    );
  };
  
  // Return the appropriate card variant
  if (variant === 'gradient') {
    return (
      <GradientCard 
        $variant={gradientColor}
        className={className}
        elevation={elevation}
        sx={cardStyle}
        {...rest}
      >
        {getCardContent()}
      </GradientCard>
    );
  }
  
  return (
    <Card 
      className={className}
      elevation={variant === 'outlined' ? 0 : elevation}
      variant={variant === 'outlined' ? 'outlined' : 'elevation'}
      sx={cardStyle}
      {...rest}
    >
      {getCardContent()}
    </Card>
  );
};

export default EnhancedCard; 