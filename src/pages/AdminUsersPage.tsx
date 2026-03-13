import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  Grid,
  Avatar,
  Tooltip,
  CircularProgress,
  Alert,
  AlertTitle,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  PersonOff as DeactivateIcon,
  PersonAdd as ActivateIcon,
} from '@mui/icons-material';
import { userAPI } from '../services/api';
import { User, UserRole } from '../interfaces';

// Simple date formatter function
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const AdminUsersPage: React.FC = () => {
  // State
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Dialog states
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openRoleDialog, setOpenRoleDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.USER);
  
  // Filter states
  const [filters, setFilters] = useState({
    username: '',
    email: '',
    is_active: '' as '' | 'true' | 'false',
    role: '' as '' | UserRole.ADMIN | UserRole.USER,
  });

  // Load users
  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      // Build params
      const params: any = {};
      if (filters.username) params.username = filters.username;
      if (filters.email) params.email = filters.email;
      if (filters.is_active !== '') params.is_active = filters.is_active === 'true';
      if (filters.role !== '') params.role = filters.role;
      
      const data = await userAPI.getAdminUsers(params);
      setUsers(data);
    } catch (err: any) {
      console.error('Error loading users:', err);
      setError(err.message || 'Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadUsers();
  }, []);

  // Handle page change
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  // Handle filter change for text fields
  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle filter change for select fields
  const handleSelectChange = (event: SelectChangeEvent<string>) => {
    const { name, value } = event.target;
    setFilters((prev) => ({
      ...prev,
      [name as string]: value,
    }));
  };
  
  // Apply filters
  const applyFilters = () => {
    loadUsers();
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      username: '',
      email: '',
      is_active: '',
      role: '',
    });
  };

  // Handle role change
  const handleRoleChange = async () => {
    if (!selectedUser) return;
    
    setLoading(true);
    try {
      await userAPI.updateUserRole(selectedUser.id, selectedRole);
      await loadUsers();
      setOpenRoleDialog(false);
    } catch (err: any) {
      console.error('Error updating role:', err);
      setError(err.message || 'Failed to update role. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle status change
  const handleStatusChange = async (user: User) => {
    setLoading(true);
    try {
      await userAPI.updateUserStatus(user.id, !user.is_active);
      await loadUsers();
    } catch (err: any) {
      console.error('Error updating status:', err);
      setError(err.message || 'Failed to update status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!selectedUser) return;
    
    setLoading(true);
    try {
      await userAPI.deleteUser(selectedUser.id);
      await loadUsers();
      setOpenDeleteDialog(false);
    } catch (err: any) {
      console.error('Error deleting user:', err);
      setError(err.message || 'Failed to delete user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Open role dialog
  const openChangeRoleDialog = (user: User) => {
    setSelectedUser(user);
    setSelectedRole(user.role);
    setOpenRoleDialog(true);
  };

  // Open delete dialog
  const openConfirmDeleteDialog = (user: User) => {
    setSelectedUser(user);
    setOpenDeleteDialog(true);
  };

  // Handle role dialog select change
  const handleRoleSelectChange = (event: SelectChangeEvent<UserRole>) => {
    setSelectedRole(event.target.value as UserRole);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        User Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>Error</AlertTitle>
          {error}
        </Alert>
      )}

      {/* Filter Section */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Filters
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Username"
              name="username"
              value={filters.username}
              onChange={handleFilterChange}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Email"
              name="email"
              value={filters.email}
              onChange={handleFilterChange}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                name="is_active"
                value={filters.is_active}
                label="Status"
                onChange={handleSelectChange}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="true">Active</MenuItem>
                <MenuItem value="false">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Role</InputLabel>
              <Select
                name="role"
                value={filters.role}
                label="Role"
                onChange={handleSelectChange}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value={UserRole.ADMIN}>Admin</MenuItem>
                <MenuItem value={UserRole.USER}>User</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={resetFilters} sx={{ mr: 1 }}>
            Reset
          </Button>
          <Button variant="contained" onClick={applyFilters}>
            Apply Filters
          </Button>
        </Box>
      </Paper>

      {/* Users Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Username</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar
                            src={user.profile?.profile_image_url || ''}
                            alt={user.username}
                            sx={{ mr: 2 }}
                          >
                            {user.username.charAt(0).toUpperCase()}
                          </Avatar>
                          <Typography>
                            {user.profile?.first_name ? `${user.profile.first_name} ${user.profile.last_name || ''}` : 'No Name'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Chip
                          icon={user.role === UserRole.ADMIN ? <AdminIcon /> : <PersonIcon />}
                          label={user.role}
                          color={user.role === UserRole.ADMIN ? 'primary' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.is_active ? 'Active' : 'Inactive'}
                          color={user.is_active ? 'success' : 'error'}
                        />
                      </TableCell>
                      <TableCell>{formatDate(user.created_at)}</TableCell>
                      <TableCell>
                        <Tooltip title="Change Role">
                          <IconButton
                            onClick={() => openChangeRoleDialog(user)}
                            color="primary"
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={user.is_active ? 'Deactivate' : 'Activate'}>
                          <IconButton
                            onClick={() => handleStatusChange(user)}
                            color={user.is_active ? 'error' : 'success'}
                          >
                            {user.is_active ? <DeactivateIcon /> : <ActivateIcon />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            onClick={() => openConfirmDeleteDialog(user)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={users.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Role Change Dialog */}
      <Dialog open={openRoleDialog} onClose={() => setOpenRoleDialog(false)}>
        <DialogTitle>Change User Role</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Change the role for user {selectedUser?.username}
          </DialogContentText>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Role</InputLabel>
            <Select
              value={selectedRole}
              label="Role"
              onChange={handleRoleSelectChange}
            >
              <MenuItem value={UserRole.ADMIN}>Admin</MenuItem>
              <MenuItem value={UserRole.USER}>User</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRoleDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleRoleChange} 
            variant="contained"
            disabled={loading}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Confirm Delete User</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to permanently delete user {selectedUser?.username}? 
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleDelete} 
            color="error" 
            variant="contained"
            disabled={loading}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminUsersPage; 