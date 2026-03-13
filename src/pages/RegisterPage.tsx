import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useFormik } from 'formik';
import * as yup from 'yup';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Link,
  Paper,
  Alert,
  CircularProgress
} from '@mui/material';
import { useAuth } from '../context/AuthContext';

const validationSchema = yup.object({
  username: yup
    .string()
    .min(3, 'Username should be at least 3 characters')
    .max(20, 'Username should not exceed 20 characters')
    .required('Username is required'),
  email: yup
    .string()
    .email('Enter a valid email')
    .required('Email is required'),
  password: yup
    .string()
    .min(6, 'Password should be at least 6 characters')
    .required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Confirm password is required'),
});

const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const formik = useFormik({
    initialValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        setError(null);
        await register({
          username: values.username,
          email: values.email,
          password: values.password,
          confirmPassword: values.confirmPassword,
        });
        navigate('/');
      } catch (err: any) {
        const errorDetail = err.response?.data?.detail;
        if (typeof errorDetail === 'string') {
          setError(errorDetail);
        } else if (Array.isArray(errorDetail)) {
          setError(errorDetail[0]?.msg || 'Registration failed');
        } else {
          setError('Registration failed. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <Container maxWidth="xs">
      <Paper elevation={3} sx={{ mt: { xs: 4, md: 8 }, p: 4, borderRadius: 2 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
            Create an Account
          </Typography>
          
          {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}
          
          <Box component="form" onSubmit={formik.handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Username"
              name="username"
              autoComplete="username"
              autoFocus
              value={formik.values.username}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.username && Boolean(formik.errors.username)}
              helperText={formik.touched.username && formik.errors.username}
              disabled={loading}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
              disabled={loading}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="new-password"
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.password && Boolean(formik.errors.password)}
              helperText={formik.touched.password && formik.errors.password}
              disabled={loading}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type="password"
              id="confirmPassword"
              autoComplete="new-password"
              value={formik.values.confirmPassword}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
              helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
              disabled={loading}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Sign Up'}
            </Button>
            <Box sx={{ textAlign: 'center' }}>
              <Link component={RouterLink} to="/login" variant="body2">
                {"Already have an account? Sign in"}
              </Link>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default RegisterPage; 