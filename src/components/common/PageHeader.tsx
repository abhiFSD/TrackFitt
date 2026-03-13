import React, { ReactNode } from 'react';
import { 
  Box, 
  Typography, 
  Breadcrumbs, 
  Link, 
  Divider, 
  useTheme, 
  useMediaQuery,
  Skeleton,
  SxProps,
  Theme
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { NavigateNext as NavigateNextIcon } from '@mui/icons-material';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  action?: ReactNode;
  divider?: boolean;
  icon?: ReactNode;
  loading?: boolean;
  sx?: SxProps<Theme>;
  titleVariant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  subtitleVariant?: 'subtitle1' | 'subtitle2' | 'body1' | 'body2' | 'caption';
  align?: 'left' | 'center' | 'right';
  spacing?: number;
  mobileSpacing?: number;
}

/**
 * A consistent page header component with breadcrumbs and action button support
 */
const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  breadcrumbs,
  action,
  divider = true,
  icon,
  loading = false,
  sx = {},
  titleVariant = 'h4',
  subtitleVariant = 'subtitle1',
  align = 'left',
  spacing = 3,
  mobileSpacing = 2,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const effectiveSpacing = isMobile ? mobileSpacing : spacing;
  
  return (
    <Box
      sx={{
        mb: effectiveSpacing,
        ...sx
      }}
    >
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" />}
          aria-label="breadcrumb"
          sx={{ mb: 1 }}
        >
          {breadcrumbs.map((item, index) => {
            const isLast = index === breadcrumbs.length - 1;
            
            if (loading) {
              return <Skeleton key={index} width={80} height={24} />;
            }
            
            if (isLast || !item.path) {
              return (
                <Typography 
                  key={index} 
                  color="text.secondary" 
                  fontWeight={isLast ? 500 : 400}
                >
                  {item.label}
                </Typography>
              );
            }
            
            return (
              <Link
                key={index}
                component={RouterLink}
                to={item.path}
                color="inherit"
                underline="hover"
              >
                {item.label}
              </Link>
            );
          })}
        </Breadcrumbs>
      )}
      
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? (align === 'center' ? 'center' : 'flex-start') : 'center',
          justifyContent: align === 'left' ? 'space-between' : (align === 'center' ? 'center' : 'flex-end'),
          mb: divider ? 2 : 0,
          textAlign: isMobile ? align : 'left',
        }}
      >
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center',
            mb: isMobile && action ? 2 : 0,
          }}
        >
          {icon && (
            <Box 
              sx={{ 
                mr: 1.5,
                display: 'flex',
                alignItems: 'center',
                color: theme.palette.primary.main
              }}
            >
              {loading ? <Skeleton variant="circular" width={40} height={40} /> : icon}
            </Box>
          )}
          
          <Box>
            {loading ? (
              <>
                <Skeleton width={240} height={40} />
                {subtitle && <Skeleton width={320} height={24} sx={{ mt: 1 }} />}
              </>
            ) : (
              <>
                <Typography 
                  variant={titleVariant} 
                  component="h1"
                  color="text.primary"
                  fontWeight={700}
                >
                  {title}
                </Typography>
                
                {subtitle && (
                  <Typography 
                    variant={subtitleVariant} 
                    color="text.secondary"
                    sx={{ mt: 0.5 }}
                  >
                    {subtitle}
                  </Typography>
                )}
              </>
            )}
          </Box>
        </Box>
        
        {action && (
          <Box sx={{ ml: isMobile ? 0 : 2 }}>
            {loading ? <Skeleton width={120} height={40} /> : action}
          </Box>
        )}
      </Box>
      
      {divider && <Divider sx={{ mt: 2 }} />}
    </Box>
  );
};

export default PageHeader; 